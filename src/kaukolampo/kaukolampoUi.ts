import Decimal from "decimal.js";
import { createState, type State } from "../../../ki-frame/src";
import {
  addItems,
  b,
  br,
  div,
  h2,
  h3,
  li,
  p,
  table,
  tbody,
  td,
  th,
  thead,
  tr,
  ul,
} from "../../../ki-frame/src/domBuilder";
import { styles } from "../../../ki-frame/src/domBuilderStyles";
import { printMoney, printPower } from "./formatting";
import {
  calculateMonthlyYearlyTotals,
  calculatePaybackInterest,
  months,
  resolveMonthlyPricingLookup,
  ymToIndex,
} from "./kaukolampoBilling";
import type { ContractPricing, MonthBillInfo, MonthlyPrice, YearTotal } from "./kaukolampoTypes";
import { parseUnderscoreSeparatedYmNumbers } from "./powerUsageString";
import { tuusulanjarvenLampo } from "./prices/tuusulanjarvenLampo";
import { range } from "./range";

export function pricingSummary(
  contract: ContractPricing,
  years: number[],
  monthlyPricing: Record<number, MonthlyPrice>,
) {
  const months = range(1, 12);
  return div(
    h2(`${contract.companyName} ${contract.contractTypeName} hinnasto ${years[0]}-${years[years.length - 1]}`),
    table(
      styles({ width: "auto" }),
      thead(
        tr(
          th({ rowSpan: 2 }),
          years.map((y) => th(y, { colSpan: 2 })),
        ),
        tr(years.map((y) => [th("kk €"), th("€/MWh")])),
      ),
      tbody(
        months.map((month) =>
          tr(
            td(month),
            years.map((year) => {
              const price = monthlyPricing[ymToIndex({ year, month })];
              return [td(printMoney(price.monthlyFee)), td(printMoney(price.powerPrice))];
            }),
          ),
        ),
      ),
    ),
  );
}

const showIncrease = (inc?: number) =>
  styles({ backgroundColor: !inc || inc === 0 ? "" : inc > 0 ? "lightpink" : "lightgreen" });

const borderLeft = { styles: { borderLeft: "2px solid #6b7280" } };

function BillItemTDs() {
  const power = td(borderLeft);
  const mwPrice = td();
  const powerPrice = td();
  const monthlyFee = td();
  const total = b();
  const setText = (info: Partial<MonthBillInfo>) => {
    addItems(power, info?.usedPower ? printPower(info.usedPower) : "");
    addItems(mwPrice, info?.powerPrice ? printMoney(info?.powerPrice) : "", showIncrease(info.monthlyMWPriceDelta));
    addItems(powerPrice, info?.usedPowerPrice ? printMoney(info.usedPowerPrice) : "");
    addItems(monthlyFee, info?.monthlyFee ? printMoney(info.monthlyFee) : "", showIncrease(info.monthlyFeeDelta));
    addItems(total, info.total ? printMoney(info.total) : "");
  };

  return {
    billTDList: [power, mwPrice, powerPrice, monthlyFee, td(total)],
    setText,
  };
}

export function billSummary(
  address: string,
  years: number[],
  monthSummary: State<Record<number, MonthBillInfo>>,
  totalsByYear: State<Record<number, YearTotal>>,
) {
  const billRows = months.map((month) =>
    tr(
      td(month),
      years.map((year) => {
        const index = ymToIndex({ year, month });
        const { billTDList, setText } = BillItemTDs();
        monthSummary.onValueChange((summaries) => {
          const monthInfo = summaries[index];
          if (monthInfo) setText(monthInfo);
        });
        return billTDList;
      }),
    ),
  );
  const totalRow = tr(
    styles({ fontWeight: "bold" }),
    td(b("Yhteensä")),
    years.map((y) => {
      const { billTDList, setText } = BillItemTDs();
      totalsByYear.onValueChange((years) => {
        const {
          billedTotals: { monthlyFees, usedPowerPrice, total },
          usedPower,
        } = years[y];
        setText({
          usedPower,
          usedPowerPrice,
          monthlyFee: monthlyFees,
          total,
        });
      });
      return billTDList;
    }),
  );

  return {
    bills: div(
      h2(`${address} laskut ${years[0]}-${years[years.length - 1]}`),
      table(
        styles({ width: "auto", textAlign: "right" }),
        thead(
          tr(
            th({ rowSpan: 2 }),
            years.map((y) => th(y, { colSpan: 5, ...borderLeft })),
          ),
          tr(years.map((y) => [th("Kulutus", borderLeft), th("€/MWh"), th("Energia €"), th("kk €"), th("Lasku €")])),
        ),
        tbody(billRows, totalRow),
      ),
    ),
    totalsByYear: totalsByYear,
  };
}

const thisYearComparisonTitle = (y: number) =>
  `tämän vuoden (${y}) tason laskeminen seuraavan vuoden (${y + 1}) korotuksen arviointia varten`;

function compareYears(comparedYears: number[], totalsByYear: Record<number, YearTotal>) {
  return comparedYears.map((y) => {
    const yearTotal = totalsByYear[y];
    const prevYear = y - 1;
    const prevTotal = totalsByYear[prevYear];
    const calculatedTotals = yearTotal.calculatedTotals;
    const { priceIncreaseTooMuch } = calculatedTotals;
    const princeIncreaseInfo =
      priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel
        ? [
            li("Korotus ylittää 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e"),
            ul(
              li(
                `150€ korotus edellisen vuoden tasolla laskettuun summaan: ${printMoney(yearTotal.totalsBasedOnLastYearLevel.total)} + 150 = `,
                b(printMoney(calculatedTotals.total)),
              ),
              li(
                `Liika laskutus: ${printMoney(yearTotal.billedTotals.total)} - ${printMoney(calculatedTotals.total)}  = `,
                b(printMoney(calculatedTotals.excessBilling)),
              ),
            ),
          ]
        : [li("Korotus ei ylitä 150e ja 15%")];
    const prevAvgMwPrice = prevTotal.calculatedTotals.avgPowerPrice;
    const explainAdjustment = () =>
      priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel && calculatedTotals.adjustmentMultiplier && prevTotal
        ? p(
            ul(
              li(
                "Liian laskutuksen takia seuraavan vuoden laskutuksessa käytetään tämän vuoden tasona viimevuoden tasoa * korjauskerroin",
              ),
              calculatedTotals.adjustmentMultiplier &&
                li(
                  `Korjauskerroin: ${printMoney(calculatedTotals.total)}/${printMoney(yearTotal.totalsBasedOnLastYearLevel.total)} = ${printPower(calculatedTotals.adjustmentMultiplier)}`,
                ),
              li(
                `Energian hinta: ${printMoney(prevAvgMwPrice)} * ${printPower(calculatedTotals.adjustmentMultiplier)} = `,
                b(printMoney(calculatedTotals.avgPowerPrice)),
              ),
              li(
                `Kuukausi: ${printMoney(prevTotal.calculatedTotals.avgMonthlyFee)} * ${printPower(calculatedTotals.adjustmentMultiplier)} = `,
                b(printMoney(calculatedTotals.avgMonthlyFee)),
              ),
            ),
          )
        : p(
            ul(
              li("Taso saadaan laskemalla keskiarvot"),
              li(
                `Energian hinta: ${printMoney(yearTotal.billedTotals.usedPowerPrice)} / ${printPower(yearTotal.usedPower)} = `,
                b(printMoney(yearTotal.calculatedTotals.avgPowerPrice)),
              ),
              li(
                `Kuukausi: ${printMoney(yearTotal.billedTotals.monthlyFees)} / ${yearTotal.monthCount} = `,
                b(printMoney(yearTotal.calculatedTotals.avgMonthlyFee)),
              ),
            ),
          );
    const prevAvgMonthlyFee = prevTotal.calculatedTotals.avgMonthlyFee;
    const totalWithPrevYearLevel = yearTotal.totalsBasedOnLastYearLevel?.total || Decimal(0);
    return div(
      h3(`${y}, vertailu toteutuneella ja ${y - 1} tasolla`),
      table(
        styles({ width: "auto" }),
        thead(tr(th(""), th("kulutus"), th("€/MWh"), th("kk €"), th("Lasku vuositasolla"), th("Liika laskutus"))),
        tbody(
          styles({ verticalAlign: "top" }),
          tr(
            td(`${y} toteunut lasku`),
            td(printPower(yearTotal.usedPower)),
            td(),
            td(),
            td(printMoney(yearTotal.billedTotals.total)),
            td(),
          ),
          tr(
            td(
              `edellisen vuoden taso ja lasku vuoden ${y} kulutuksella`,
              ul(
                li(
                  `Vuoden ${y} energiakulutus ${printPower(yearTotal.usedPower)} vuoden ${y - 1} kuukausimaksulla ja energian hinnalla: `,
                  br(),
                  `${printPower(yearTotal.usedPower)} * ${printMoney(prevAvgMwPrice)} + ${yearTotal.monthCount} * ${printMoney(prevAvgMonthlyFee)} = `,
                  b(printMoney(totalWithPrevYearLevel)),
                ),
              ),
            ),
            td(printPower(yearTotal.usedPower)),
            td(printMoney(prevAvgMwPrice)),
            td(printMoney(prevAvgMonthlyFee)),
            td(printMoney(totalWithPrevYearLevel)),
            td(),
          ),
          tr(
            td(
              `Korotuksen arvionti vuodelle ${y}`,
              ul(
                li(
                  `${y} yhteensä ${printMoney(yearTotal.billedTotals.total)}, ${prevYear} tasolla ${printMoney(totalWithPrevYearLevel)}`,
                ),
                li(
                  `Korotus ${printMoney(calculatedTotals.priceIncreaseEuros || Decimal(0))} euroa ${printPower(calculatedTotals.priceIncreasePercents || Decimal(0))} prosenttia`,
                ),
                princeIncreaseInfo,
              ),
            ),
            td(),
            td(),
            td(),
            td(priceIncreaseTooMuch && printMoney(calculatedTotals.total)),
            td(priceIncreaseTooMuch && b(printMoney(calculatedTotals.excessBilling))),
          ),
          tr(
            td(thisYearComparisonTitle(y), explainAdjustment()),
            td(),
            td(printMoney(calculatedTotals.avgPowerPrice)),
            td(printMoney(calculatedTotals.avgMonthlyFee)),
            td(),
          ),
        ),
      ),
    );
  });
}

function firstYearCompareInfo(firstYear: number, totalsByYear: Record<number, YearTotal>) {
  const firstYearTotals = totalsByYear[firstYear];
  const firstAvgMwPrice = printMoney(firstYearTotals.calculatedTotals.avgPowerPrice);
  const firstAvgMonthlyFee = printMoney(firstYearTotals.calculatedTotals.avgMonthlyFee);
  return div(
    h3(`${firstYear} tason laskeminen`),
    table(
      styles({ width: "auto" }),
      thead(tr(th(""), th("kulutus"), th("€/MWh"), th("kk €"))),
      tbody(
        styles({ verticalAlign: "top" }),
        tr(
          td(
            thisYearComparisonTitle(firstYear),
            ul(
              li(
                `${firstYear} Energian hinta €/MWh: ${printMoney(firstYearTotals.billedTotals.usedPowerPrice)} / ${printPower(firstYearTotals.usedPower)} = `,
                b(firstAvgMwPrice),
              ),
              li(
                `${firstYear} Kuukausimaksu: ${printMoney(firstYearTotals.billedTotals.monthlyFees)} / ${firstYearTotals.monthCount} = `,
                b(firstAvgMonthlyFee),
              ),
            ),
          ),
          td(printPower(firstYearTotals.usedPower)),
          td(firstAvgMwPrice),
          td(firstAvgMonthlyFee),
        ),
      ),
    ),
  );
}

function excessBillingPaybackInterest(
  excessYears: number[],
  totalsByYear: Record<number, YearTotal>,
  monthlyPricing: Record<number, MonthBillInfo>,
) {
  const paybackInterestYears = calculatePaybackInterest(excessYears, monthlyPricing, totalsByYear);

  const years = paybackInterestYears.map((info) =>
    div(
      h3(info.year),
      table(
        styles({ width: "auto" }),
        thead(
          tr(
            th("Pohjatiedot", { colSpan: 3 }),
            th("Ylilaskutus jos verrataan +150 tasoon vuoden yli", { colSpan: 3 }, borderLeft),
            th("Ylilaskutus jos 150€ annetaan kertyä vuoden alussa", { colSpan: 3 }, borderLeft),
          ),
          tr(
            th("vuosi.kk"),
            th("Kulutus"),
            th("Alkuperäinen lasku"),
            // keskiarvoon verrattu
            th("Korjattu lasku", borderLeft),
            th("Ylilaskutus"),
            th("Viivästyskorko"),
            // viime vuoden taso ja 150e puskuri
            th("Lasku aiemman vuoden tasolla", borderLeft),
            th("Korjattu lasku"),
            th("150 eurosta jäljellä"),
            th("Ylilaskutus"),
            th("Viivästyskorko"),
          ),
        ),
        tbody(
          info.months.map((m) => {
            return tr(
              td(m.month),
              td(printPower(m.originalBill.usedPower)),
              td(printMoney(m.originalBill.total)),
              // keskiarvoon verrattu
              td(printMoney(m.excessFromAveragePrices.total), borderLeft),
              td(printMoney(m.excessFromAveragePrices.excess)),
              td(printMoney(m.excessFromAveragePrices.interest)),
              // viime vuoden taso ja 150e puskuri
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.totalWithLastYearLevel), borderLeft),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.total)),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.leftFrom150)),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.excess)),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.interest)),
            );
          }),
        ),
        tr(
          td("Yhteensä"),
          td(),
          td(),
          td(printMoney(info.fromAveragePricesTotals.total), borderLeft),
          td(printMoney(info.fromAveragePricesTotals.excess)),
          td(printMoney(info.fromAveragePricesTotals.interest)),
          td(borderLeft),
          td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.total)),
          td(),
          td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.excess)),
          td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.interest)),
        ),
      ),
    ),
  );
  return {
    paybackInterestYears,
    root: years,
  };
}

export function priceIncreasesAndPaybackInterest(
  years: number[],
  totalsByYear: Record<number, YearTotal>,
  monthlyPricing: Record<number, MonthBillInfo>,
) {
  const [firstYear, ...comparedYears] = years;
  const excessYears = comparedYears.filter((y) => totalsByYear[y].calculatedTotals.excessBilling.toNumber() > 0);
  const { root: paybackInterest, paybackInterestYears } = excessBillingPaybackInterest(
    excessYears,
    totalsByYear,
    monthlyPricing,
  );
  const paybackInterestTotal = paybackInterestYears.reduce(
    (acc, y) => acc.add(y.fromAveragePricesTotals.interest),
    Decimal(0),
  );
  return div(
    h2("Korotusten arviointi"),
    firstYearCompareInfo(firstYear, totalsByYear),
    compareYears(comparedYears, totalsByYear),
    excessYears.length > 0 &&
      div(
        h2("Liiallinen laskutus ja viivästyskorko"),
        ul(
          { class: "pagebreak" },
          excessYears.map((y) => li(`${y}: ${printMoney(totalsByYear[y].calculatedTotals.excessBilling)}€`)),
          li(`Viivästyskorko: ${printMoney(paybackInterestTotal)}€`),
          li(
            `Yhteensä: ${printMoney(excessYears.reduce((acc, y) => acc.add(totalsByYear[y].calculatedTotals.excessBilling), paybackInterestTotal))}€`,
          ),
        ),
        h2("Kuukausikohtaisen viivästyskoron laskeminen"),
        p(
          "Viivästyskorko laskettuna korjattujen kuukausien laskujen maksupäivästä. Korjattuina kuukausina rahaa on kerätty perusteettomasti",
        ),
        paybackInterest,
      ),
  );
}

const usage =
  "2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899";

export function kaukolampoExcessPricingCalculator() {
  const contract = tuusulanjarvenLampo;
  const from = { year: 2022, month: 1 };
  const to = { year: 2025, month: 12 };
  const years = range(from.year, to.year);
  const address = "Jätintie 1 A";
  const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to);
  const powerUsage = parseUnderscoreSeparatedYmNumbers(usage);
  const powerUsageState = createState<typeof powerUsage.numbers>({});
  const totalsByYear = createState<Record<number, YearTotal>>({});
  const monthSummary = createState<Record<number, MonthBillInfo>>({});
  const priceIncreases = div();
  powerUsageState.onValueChange((powerUsage) => {
    const newTotals = calculateMonthlyYearlyTotals(years, monthlyPricing, powerUsage);
    totalsByYear.set(newTotals.totalsByYear);
    monthSummary.set(newTotals.monthSummary);
    priceIncreases.replaceChildren(
      priceIncreasesAndPaybackInterest(years, newTotals.totalsByYear, newTotals.monthSummary),
    );
  });

  const { bills } = billSummary(address, years, monthSummary, totalsByYear);
  powerUsageState.set(powerUsage.numbers);
  return div(bills, priceIncreases);
}
