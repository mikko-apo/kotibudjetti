import Decimal from "decimal.js";
import { createState, type State } from "../../../ki-frame/src";
import {
  a,
  appendChildren,
  b,
  br,
  button,
  div,
  h2,
  h3,
  inputText,
  li,
  p,
  replaceChildren,
  table,
  tbody,
  td,
  text,
  th,
  thead,
  tr,
  ul,
} from "../../../ki-frame/src/domBuilder";
import { events, setEvents } from "../../../ki-frame/src/domBuilderEvents";
import { styles } from "../../../ki-frame/src/domBuilderStyles";
import { printMoney, printPower } from "./formatting";
import {
  calculateMonthlyYearlyTotals,
  calculatePaybackInterest,
  indexToYm,
  months,
  resolveMonthlyPricingLookup,
  ymToIndex,
} from "./kaukolampoBilling";
import type { MonthBillInfo, PaybackInterestYear, UnpackedPowerUsage, YearTotal } from "./kaukolampoTypes";
import { formatAsUnderscoreSeparated, parseUnderscoreSeparatedYmNumbers } from "./powerUsageString";
import { tuusulanjarvenLampo } from "./prices/tuusulanjarvenLampo";
import { range } from "./range";
import { shortHexHash } from "./util";

const showIncrease = (inc?: number) =>
  styles({ backgroundColor: !inc || inc === 0 ? "" : inc > 0 ? "lightpink" : "lightgreen" });

const borderLeft = { styles: { borderLeft: "2px solid #6b7280" } };
const pageBreakAfter = { class: "pagebreak" };

function BillItemTDs(index?: number) {
  const usedPowerText = text();
  const usedPowerTextDiv = div(usedPowerText);
  const usedPowerInput = index && inputText({ name: index.toString(), hidden: true }, styles({ width: "6ch" }));
  const usedPower = td(borderLeft, usedPowerTextDiv, usedPowerInput);
  const mwPrice = td();
  const powerPrice = td();
  const monthlyFee = td();
  const total = b();
  const setText = (info?: Partial<MonthBillInfo>) => {
    if (info?.usedPower) {
      usedPowerText.textContent = printPower(info.usedPower);
      usedPowerInput && (usedPowerInput.value = printPower(info.usedPower));
    } else {
      usedPowerText.textContent = "";
      usedPowerInput && (usedPowerInput.value = "");
    }
    replaceChildren(mwPrice, info?.powerPrice ? printMoney(info?.powerPrice) : "", showIncrease(info?.mWPriceDelta));
    replaceChildren(powerPrice, info?.usedPowerPrice ? printMoney(info.usedPowerPrice) : "");
    replaceChildren(
      monthlyFee,
      info?.monthlyFee ? printMoney(info.monthlyFee) : "",
      showIncrease(info?.monthlyFeeDelta),
    );
    replaceChildren(total, info?.total ? printMoney(info.total) : "");
  };

  return {
    billTDList: [usedPower, mwPrice, powerPrice, monthlyFee, td(total)],
    setText,
    usedPowerText,
    usedPowerTextDiv,
    usedPowerInput,
  };
}

export function billSummary(
  address: string,
  years: number[],
  monthSummary: State<Record<number, MonthBillInfo>>,
  totalsByYear: State<Record<number, YearTotal>>,
  powerUsageState: State<UnpackedPowerUsage>,
) {
  const usedPowerEditable = createState(false);
  const billRows = months.map((month) =>
    tr(
      td(month),
      years.map((year) => {
        const index = ymToIndex({ year, month });
        const { billTDList, setText, usedPowerInput, usedPowerText, usedPowerTextDiv } = BillItemTDs(index);
        // monthSummary has changed, update other fields than usedPower
        monthSummary.onValueChange((summaries) => {
          const monthInfo = summaries[index];
          setText(monthInfo);
        });
        if (usedPowerInput) {
          // toggle input and text view
          usedPowerEditable.onValueChange((showInput) => {
            usedPowerInput.hidden = !showInput;
            usedPowerTextDiv.hidden = showInput;
          });
          // catch change event and update other tables
          setEvents<"input">(
            usedPowerInput,
            events({
              change({ node, event }) {
                const value = node.value;
                const newUsedPower = ["0", ""].includes(value.trimEnd().trimStart()) ? undefined : Decimal(value);
                usedPowerText.textContent = newUsedPower ? value : "";
                powerUsageState.set((cur) => {
                  const numbers = { ...cur.numbers };
                  if (newUsedPower) {
                    numbers[index] = Decimal(value);
                  } else {
                    delete numbers[index];
                  }
                  return {
                    ...cur,
                    numbers,
                  };
                });
              },
            }),
          );
        }
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

  const priceChangeTBody = tbody();
  monthSummary.onValueChange((summaries) => {
    const allBills = years.flatMap((year) => months.map((month) => summaries[ymToIndex({ year, month })]));
    const billsWithChanges = allBills.filter((bill) => bill && (bill.monthlyFeeDelta != 0 || bill.mWPriceDelta != 0));
    const rows = billsWithChanges.map((bill) => {
      const prevBill = summaries[bill.index - 1];
      const yearMonth = indexToYm(bill.index);
      return tr(
        td(`${yearMonth.year}.${yearMonth.month}`),
        td(
          `${printMoney(prevBill.powerPrice)}€/MW -> ${printMoney(bill.powerPrice)}€/MW`,
          `, muutos ${printMoney(bill.powerPrice.div(prevBill.powerPrice).minus(1).mul(100))}%`,
        ),
        td(
          `${printMoney(prevBill.monthlyFee)}€/kk -> ${printMoney(bill.monthlyFee)}€/kk`,
          `, muutos ${printMoney(bill.monthlyFee.div(prevBill.monthlyFee).minus(1).mul(100))}%`,
        ),
      );
    });
    replaceChildren(priceChangeTBody, rows);
  });
  const priceChangeComparedToFirstYear = div();
  totalsByYear.onValueChange((yearTotals) => {
    const [firstYear, ...compareYears] = years;
    const firstData = yearTotals[firstYear].calculatedTotals;
    replaceChildren(
      priceChangeComparedToFirstYear,
      table(
        styles({ width: "auto", textAlign: "right" }),
        thead(
          tr(
            th("Vuosi"),
            th("Laskutuskuukausia"),
            th("Kulutus"),
            th("Toteutunut laskutus"),
            th(`Laskutus edellisen vuoden tasolla`),
            th("Korotus €"),
            th("Korotus %"),
            th("Ylilaskutus €"),
            th(`Laskutus vuoden ${years[0]} tasolla`),
            th("Korotus €"),
            th("Korotus %"),
          ),
          years.map((y) => {
            const currentYear = yearTotals[y];
            const usedPower = currentYear.usedPower;
            const totalOnFirstYearLevel = usedPower
              .mul(firstData.avgPowerPrice)
              .add(firstData.avgMonthlyFee.mul(currentYear.monthCount));
            return tr(
              td(y),
              td(currentYear.monthCount),
              td(printPower(usedPower), " MW"),
              td(printMoney(currentYear.billedTotals.total), " €"),
              td(
                currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.totalsBasedOnLastYearLevel.total),
                " €",
              ),
              td(
                currentYear.totalsBasedOnLastYearLevel &&
                  printMoney(currentYear.billedTotals.total.minus(currentYear.totalsBasedOnLastYearLevel.total)),
                " €",
              ),
              td(
                currentYear.totalsBasedOnLastYearLevel &&
                  printPower(
                    currentYear.billedTotals.total.div(currentYear.totalsBasedOnLastYearLevel.total).minus(1).mul(100),
                  ),
              ),
              td(
                currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.calculatedTotals.excessBilling),
                " €",
              ),
              td(printMoney(totalOnFirstYearLevel), " €"),
              td(printMoney(currentYear.billedTotals.total.minus(totalOnFirstYearLevel)), " €"),
              td(printPower(currentYear.billedTotals.total.div(totalOnFirstYearLevel).minus(1).mul(100))),
            );
          }),
        ),
      ),
    );
  });

  const powerUsageHashInfo = text();
  const powerUsageAsLink = a("Kulutusarvot linkkinä", { class: "no-print" });
  powerUsageState.onValueChange((powerUsage) => {
    if (powerUsage) {
      const data = formatAsUnderscoreSeparated(powerUsage);
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("p", data);
      appendChildren(powerUsageAsLink, { href: url.toString() });
      shortHexHash(data, 12).then((s) => (powerUsageHashInfo.textContent = `Kulutusarvojen tarkisteluku: ${s}`));
    }
  });
  return div(
    h2(`${address} laskut ${years[0]}-${years[years.length - 1]}`),
    table(
      styles({ width: "auto", textAlign: "right" }),
      thead(
        tr(
          th({ rowSpan: 2 }),
          years.map((y) => th(y, { colSpan: 5, ...borderLeft })),
        ),
        tr(years.map((y) => [th("Kulutus", borderLeft), th("€/MWh"), th("Energia €"), th("$/kk"), th("Lasku €")])),
      ),
      tbody(billRows, totalRow),
    ),
    div(
      button(
        "Muokkaa kulutusarvoja",
        { class: "blueButton" },
        { class: "no-print" },
        events({
          click() {
            usedPowerEditable.set((cur) => !cur);
          },
        }),
      ),
      powerUsageAsLink,
      powerUsageHashInfo,
    ),
    h3("Hinnanmuutokset"),
    table(styles({ width: "auto" }), priceChangeTBody),
    h3(`Hinnanmuutokset vuositasolla`),
    priceChangeComparedToFirstYear,
  );
}

function compareYears(comparedYears: number[], totalsByYear: Record<number, YearTotal>) {
  return comparedYears.map((y) => {
    const yearTotal = totalsByYear[y];
    const prevYear = y - 1;
    const prevTotal: YearTotal | undefined = totalsByYear[prevYear];
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
    const prevAvgMwPrice = prevTotal?.calculatedTotals.avgPowerPrice;
    const explainAdjustment = () =>
      prevTotal && priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel && calculatedTotals.adjustmentMultiplier
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
    const prevAvgMonthlyFee = prevTotal?.calculatedTotals.avgMonthlyFee;
    const totalWithPrevYearLevel = yearTotal.totalsBasedOnLastYearLevel?.total || Decimal(0);
    return div(
      h3(prevTotal ? `${y}, vertailu toteutuneella ja ${y - 1} tasolla` : `${y} tason laskeminen`),
      table(
        styles({ width: "auto" }),
        thead(
          tr(
            th(""),
            th("kulutus"),
            th("€/MWh"),
            th("$/kk"),
            th("Lasku vuositasolla"),
            priceIncreaseTooMuch && th(b("Liika laskutus")),
          ),
        ),
        tbody(
          styles({ verticalAlign: "top" }),
          tr(
            td(`${y} toteunut lasku`),
            td(printPower(yearTotal.usedPower)),
            td(),
            td(),
            td(printMoney(yearTotal.billedTotals.total)),
            priceIncreaseTooMuch && td(),
          ),
          prevTotal &&
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
              priceIncreaseTooMuch && td(),
            ),
          prevTotal &&
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
              priceIncreaseTooMuch && td(b(printMoney(calculatedTotals.excessBilling))),
            ),
          tr(
            td(
              `tämän vuoden (${y}) tason laskeminen seuraavan vuoden (${y + 1}) korotuksen arviointia varten`,
              explainAdjustment(),
            ),
            td(),
            td(printMoney(calculatedTotals.avgPowerPrice)),
            td(printMoney(calculatedTotals.avgMonthlyFee)),
            td(),
            priceIncreaseTooMuch && td(),
          ),
        ),
      ),
    );
  });
}

function excessBillingPaybackInterest(paybackInterestYears: PaybackInterestYear[]) {
  return paybackInterestYears.map((info) =>
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
}

const usage =
  "2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899";

function getPUrlParameter(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("p");
}

export function kaukolampoExcessPricingCalculator() {
  const contract = tuusulanjarvenLampo;
  const from = { year: 2022, month: 1 };
  const to = { year: 2025, month: 12 };
  const years = range(from.year, to.year);
  const address = "Jätintie 1 A";
  const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to);
  const pFromBrowserUrl = getPUrlParameter();
  const powerUsage = parseUnderscoreSeparatedYmNumbers(pFromBrowserUrl || usage);

  const powerUsageState = createState<UnpackedPowerUsage>(powerUsage);
  const totalsByYearState = createState<Record<number, YearTotal>>({});
  const monthSummaryState = createState<Record<number, MonthBillInfo>>({});

  const summary = div();
  const priceIncreases = div(pageBreakAfter);
  const paybackInterest = div();

  powerUsageState.onValueChange((powerUsage) => {
    if (powerUsage) {
      // recalculation of values
      const newTotals = calculateMonthlyYearlyTotals(years, monthlyPricing, powerUsage.numbers);
      const totalsByYear = newTotals.totalsByYear;
      const monthBillInfos = newTotals.monthSummary;
      const excessYears = years.filter((y) => totalsByYear[y].calculatedTotals.excessBilling.toNumber() > 0);
      const paybackInterestYears = calculatePaybackInterest(excessYears, monthBillInfos, totalsByYear);
      const paybackInterestTotal = paybackInterestYears.reduce(
        (acc, y) => acc.add(y.fromAveragePricesTotals.interest),
        Decimal(0),
      );

      replaceChildren(
        summary,
        h2("Liiallinen laskutus ja viivästyskorko"),
        ul(
          excessYears.map((y) => li(`${y}: ${printMoney(totalsByYear[y].calculatedTotals.excessBilling)}€`)),
          li(`Viivästyskorko: ${printMoney(paybackInterestTotal)}€`),
          li(
            `Yhteensä: ${printMoney(excessYears.reduce((acc, y) => acc.add(totalsByYear[y].calculatedTotals.excessBilling), paybackInterestTotal))}€`,
          ),
        ),
      );

      // render bill data
      totalsByYearState.set(totalsByYear);
      monthSummaryState.set(monthBillInfos);

      replaceChildren(priceIncreases, h2("Korotusten arviointi"), compareYears(years, totalsByYear));

      replaceChildren(
        paybackInterest,
        excessYears.length > 0 &&
          div(
            h2("Kuukausikohtaisen viivästyskoron laskeminen"),
            p(
              "Viivästyskorko laskettuna korjattujen kuukausien laskujen maksupäivästä. Korjattuina kuukausina rahaa on kerätty perusteettomasti",
            ),
            excessBillingPaybackInterest(paybackInterestYears),
          ),
      );
    }
  });

  const bills = billSummary(address, years, monthSummaryState, totalsByYearState, powerUsageState);
  powerUsageState.republish();
  return div(summary, div(pageBreakAfter, bills), priceIncreases, paybackInterest);
}
