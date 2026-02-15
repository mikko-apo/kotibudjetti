import Decimal from "decimal.js";
import {createState, State} from "../../../ki-frame/src";
import {Component} from "../../../ki-frame/src/component";
import {
  b,
  div,
  h2,
  h3,
  li,
  p,
  setElementToId,
  table,
  tbody,
  td,
  th,
  thead,
  tr,
  ul
} from "../../../ki-frame/src/domBuilder";
import {styles} from "../../../ki-frame/src/domBuilderStyles";
import {printMoney, printPower} from "./formatting";
import type {AdjustedYearTotal, ContractPricing, MonthBillInfo, MonthlyPrice, YearTotal,} from "./kaukolampoTypes";
import {range} from "./range";
import {
  calculateMonthlyYearBillTotals,
  calculatePaybackInterest,
  months,
  resolveMonthlyPricingLookup,
  ymToIndex
} from "./kaukolampoBilling";
import {tuusulanjarvenLampo} from "./prices/tuusulanjarvenLampo";
import {parseUnderscoreSeparatedYmNumbers} from "./powerUsageString";


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
              return [td(printMoney(price.monthlyFee)), td(printMoney(price.mWPrice))];
            }),
          ),
        ),
      ),
    ),
  );
}

const showIncrease = (inc?: number) =>
  !inc || inc === 0 ? {} : inc > 0 ? { backgroundColor: "lightpink" } : { backgroundColor: "lightgreen" };

const borderLeft = { styles: { borderLeft: "2px solid #6b7280" } };

function BillItemTDs() {
  const power = td(borderLeft);
  const mwPrice = td();
  const powerPrice = td();
  const monthlyFee = td();
  const total = b();
  const billTDs = new Component({ power, mwPrice, powerPrice, monthlyFee, total });
  const setText = (info: Partial<MonthBillInfo>) =>
    billTDs.setText({
      power: info?.power ? printPower(info.power) : "",
      mwPrice: info?.mWPrice ? printMoney(info.mWPrice) : "", // styles(showIncrease(monthInfo.monthlyMWPriceHasIncreased))
      powerPrice: info?.powerPrice ? printMoney(info.powerPrice) : "",
      monthlyFee: info?.monthlyFee ? printMoney(info.monthlyFee) : "", // styles(showIncrease(monthInfo.monthlyFeeHasIncreased)),
      total: info.powerPrice && info.monthlyFee ? printMoney(info.powerPrice.add(info.monthlyFee)) : "", // should be bold
    });

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
        const { monthlyFee, mWPrice, totalEnergy } = years[y];
        setText({
          power: totalEnergy,
          powerPrice: mWPrice,
          monthlyFee: monthlyFee,
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

function calculateNewPricingWithMax150PriceIncrease(
  totalWithLastYearLevel: Decimal,
  monthlyFee: Decimal,
  mwPrice: Decimal,
  totalEnergy: Decimal,
): AdjustedYearTotal {
  const adjustment = totalWithLastYearLevel.add(150).div(totalWithLastYearLevel);
  return {
    monthCount: 12,
    totalEnergy,
    adjustment,
    monthlyFee: monthlyFee.mul(12).mul(adjustment),
    mWPrice: mwPrice.mul(totalEnergy).mul(adjustment),
  };
}

function compareYears(
  comparedYears: number[],
  adjustedPricing: Record<number, AdjustedYearTotal>,
  totalsByYear: Record<number, YearTotal>,
  excessBillingAll: Record<number, Decimal>,
  years: number[],
) {
  return comparedYears.map((y) => {
    // values for previous year
    const prevYear = y - 1;
    const adjustedPricingForPreviousYear = adjustedPricing[prevYear];
    const prevTotals = adjustedPricingForPreviousYear || totalsByYear[prevYear];
    const prevAvgMonthlyFee = prevTotals.monthlyFee.div(prevTotals.monthCount);
    const prevAvgMwPrice = prevTotals.mWPrice.div(prevTotals.totalEnergy);
    // totals for this year
    const totals = totalsByYear[y];
    const totalWithPrevYearLevel = totals.totalEnergy.mul(prevAvgMwPrice).add(prevAvgMonthlyFee.mul(totals.monthCount));
    const totalWithThisYearLevel = totals.mWPrice.add(totals.monthlyFee);
    // price increase
    const priceIncreaseEuros = totalWithThisYearLevel.minus(totalWithPrevYearLevel);
    const priceIncreasePercents = totalWithThisYearLevel.div(totalWithPrevYearLevel).minus(1).mul(100);
    const priceIncreaseTooMuch = priceIncreaseEuros.toNumber() > 150 && priceIncreasePercents.toNumber() > 15;
    const adjusted = calculateNewPricingWithMax150PriceIncrease(
      totalWithPrevYearLevel,
      prevAvgMonthlyFee,
      prevAvgMwPrice,
      totals.totalEnergy,
    );
    const totalWithPrevYearLevelPlus150 = totalWithPrevYearLevel.add(150);
    const excessBilling = totalWithThisYearLevel.minus(totalWithPrevYearLevelPlus150);
    if (priceIncreaseTooMuch) {
      adjustedPricing[y] = adjusted;
      excessBillingAll[y] = excessBilling;
    }
    const princeIncreaseInfo = priceIncreaseTooMuch
      ? [
          li("Korotus ylittää 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e"),
          ul(
            li(
              `150€ korotus edellisen vuoden tasolla laskettuun summaan: ${printMoney(totalWithPrevYearLevel)} + 150 = `,
              b(printMoney(totalWithPrevYearLevelPlus150)),
            ),
            li(
              `Liika laskutus: ${printMoney(totalWithThisYearLevel)} - ${printMoney(totalWithPrevYearLevelPlus150)}  = `,
              b(printMoney(excessBilling)),
            ),
          ),
        ]
      : [li("Korotus ei ylitä 150e ja 15%")];
    const explainAdjustment =
      priceIncreaseTooMuch &&
      y !== years[years.length - 1] &&
      p(
        "Koska vuositasoista laskua piti korjata, seuraavan vuoden laskutuksessa käytetään tämän vuoden tasona viimevuoden tasoa * korjauskerroin",
        ul(
          li(
            `Korjauskerroin: ${printMoney(totalWithPrevYearLevelPlus150)}/${printMoney(totalWithPrevYearLevel)} = ${printPower(adjusted.adjustment)}`,
          ),
          li(
            `Energian hinta: ${printMoney(prevAvgMwPrice)} * ${printPower(adjusted.adjustment)} = `,
            b(printMoney(adjusted.mWPrice.div(adjusted.totalEnergy))),
          ),
          li(
            `Kuukausi: ${printMoney(prevAvgMonthlyFee)} * ${printPower(adjusted.adjustment)} = `,
            b(printMoney(adjusted.monthlyFee.div(adjusted.monthCount))),
          ),
        ),
      );
    return div(
      h3(`${y}, vertailu toteutuneella ja ${prevYear} tasolla`),
      p(
        `Edellisen vuoden (${y - 1}) taso`,
        ul(
          adjustedPricingForPreviousYear && li(b("Käytetään korjattua tasoa")),
          li(
            `Energian hinta: ${printMoney(prevTotals.mWPrice)} / ${printPower(prevTotals.totalEnergy)} = `,
            b(printMoney(prevAvgMwPrice)),
          ),
          li(
            `Kuukausimaksu: ${printMoney(prevTotals.monthlyFee)} / ${prevTotals.monthCount} = `,
            b(printMoney(prevAvgMonthlyFee)),
          ),
          li(
            `Vuoden ${y} energiakulutus ${printPower(totals.totalEnergy)} vuoden (${y - 1}) kuukausimaksulla ja energian hinnalla: `,
            `${printPower(totals.totalEnergy)} * ${printMoney(prevAvgMwPrice)} + ${totals.monthCount} * ${printMoney(prevAvgMonthlyFee)} = `,
            b(printMoney(totalWithPrevYearLevel)),
          ),
        ),
      ),
      p(
        `Korotus ${y} vs ${prevYear} tasolla`,
        ul(
          li(
            `${y} yhteensä ${printMoney(totalWithThisYearLevel)}, ${prevYear} tasolla ${printMoney(totalWithPrevYearLevel)}`,
          ),
          li(`Korotus ${printMoney(priceIncreaseEuros)} euroa ${printPower(priceIncreasePercents)} prosenttia`),
          princeIncreaseInfo,
        ),
      ),
      explainAdjustment,
    );
  });
}



function excessBillingPaybackInterest(
  excessYears: number[],
  adjustedPricing: Record<number, AdjustedYearTotal>,
  monthlyPricing: Record<number, MonthBillInfo>,
) {
  const { excessTotal, paybackInterestTotal, months } = calculatePaybackInterest(
    excessYears,
    monthlyPricing,
    adjustedPricing,
  );

  return {
    root: table(
      styles({ width: "auto" }),
      thead(
        tr(
          th("vuosi.kk"),
          th("Kulutus"),
          th("Alkuperäinen lasku"),
          th("Korjattu lasku"),
          th("Ylilaskutus"),
          th("Viivästyskorko"),
        ),
      ),
      tbody(
        months.map((m) => {
          return tr(
            td(m.date),
            td(printPower(m.originalBill.power)),
            td(printMoney(m.originalTotal)),
            td(printMoney(m.adjustedTotal)),
            td(printMoney(m.excess)),
            td(printMoney(m.interest)),
          );
        }),
      ),
      tr(td("Yhteensä"), td(), td(), td(), td(printMoney(excessTotal)), td(printMoney(paybackInterestTotal))),
    ),
    paybackInterestTotal,
  };
}

export function priceIncreasesAndPaybackInterest(
  years: number[],
  totalsByYear: Record<number, YearTotal>,
  monthlyPricing: Record<number, MonthBillInfo>,
) {
  const comparedYears = years.slice(1);
  const adjustedPricing: Record<number, AdjustedYearTotal> = {};
  const excessBillingAll: Record<number, Decimal> = {};
  const yearComparison = compareYears(comparedYears, adjustedPricing, totalsByYear, excessBillingAll, years);
  const excessYears = comparedYears.filter((y) => excessBillingAll[y]);
  const { root: paybackInterest, paybackInterestTotal } = excessBillingPaybackInterest(
    excessYears,
    adjustedPricing,
    monthlyPricing,
  );
  return div(
    h2("Korotusten arviointi"),
    yearComparison,
    Object.keys(excessBillingAll).length > 0 && [
      h2("Liiallinen laskutus ja viivästyskorko"),
      ul(
        { class: "pagebreak" },
        excessYears.map((y) => li(`${y}: ${printMoney(excessBillingAll[y])}€`)),
        li(`Viivästyskorko: ${printMoney(paybackInterestTotal)}€`),
        li(
          `Yhteensä: ${printMoney(Object.values(excessBillingAll).reduce((acc, v) => acc.add(v), paybackInterestTotal))}€`,
        ),
      ),
      h2("Kuukausikohtaisen viivästyskoron laskeminen"),
      p(
        "Viivästyskorko laskettuna korjattujen kuukausien laskujen maksupäivästä. Korjattuina kuukausina rahaa on kerätty perusteettomasti",
      ),
      paybackInterest,
    ],
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
    const newTotals = calculateMonthlyYearBillTotals(years, monthlyPricing, powerUsage);
    totalsByYear.set(newTotals.totalsByYear);
    monthSummary.set(newTotals.monthSummary);
    priceIncreases.replaceChildren(priceIncreasesAndPaybackInterest(years, newTotals.totalsByYear, newTotals.monthSummary));
  });

  const { bills } = billSummary(address, years, monthSummary, totalsByYear);
  powerUsageState.set(powerUsage.numbers);
  return div(bills, priceIncreases);
}
