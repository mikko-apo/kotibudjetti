import Decimal from "decimal.js";
import { b, div, h2, h3, li, p, table, tbody, td, th, thead, tr, ul } from "../../../ki-frame/src/domBuilder";
import { styles } from "../../../ki-frame/src/domBuilderStyles";
import { isDefined } from "../../../ki-frame/src/util/typeUtils";
import { printMoney, printPower } from "./formatting";
import type {
  AdjustedYearTotal,
  ContractPricing,
  MonthlyPrice,
  PowerUsage,
  YearMonth,
  YearTotal,
} from "./kaukolampoTypes";
import { range } from "./range";
import { calculateViivastyskorkoMultiplier, toDateISO } from "./viivastyskorko";

export const ymToIndex = (ym: YearMonth) => ym.year * 12 + (ym.month - 1);
const indexToYm = (idx: number): YearMonth => {
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return { year, month };
};

export function resolveMonthlyPricingLookup(
  contract: ContractPricing,
  from: YearMonth,
  to: YearMonth,
): Record<number, MonthlyPrice> {
  const result: Record<number, MonthlyPrice> = {};
  const sortedPricesDesc = [...contract.monthlyPricing].sort((a, b) => ymToIndex(b) - ymToIndex(a));
  for (let c = ymToIndex(from); c <= ymToIndex(to); c++) {
    const firstLower = sortedPricesDesc.find((value) => ymToIndex(value) <= c && value.price);
    if (firstLower && isDefined(firstLower.price)) {
      const { monthlyFee, mWPrice } = firstLower.price;
      result[c] = {
        monthlyFee: Decimal(monthlyFee),
        mWPrice: Decimal(mWPrice),
      };
    } else {
      throw new Error(`${indexToYm(c)} is not in the range of contract prices for ${contract.id}`);
    }
  }
  return result;
}

export function parseUnderscoreSeparatedYmNumbers(input: string): PowerUsage {
  if (typeof input !== "string") throw new TypeError("input must be a string");

  const tokens = input
    .split("_")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("input must contain at least a year-month anchor");
  }

  const ymRegex = /^(\d{4})-(\d{1,2})$/;
  const first = tokens[0];
  const ymMatch = first.match(ymRegex);
  if (!ymMatch) {
    throw new Error(`first token must be year-month in form YYYY-M: got "${first}"`);
  }

  const year = Number(ymMatch[1]);
  const month = Number(ymMatch[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`invalid year-month anchor: "${first}"`);
  }

  const from: YearMonth = { year, month };
  let idx = ymToIndex(from);

  const numbers: Record<number, Decimal> = {};
  const numberTokens = tokens.slice(1);

  // If no number tokens, to defaults to from
  if (numberTokens.length === 0) {
    return { from, to: from, numbers };
  }

  for (const t of numberTokens) {
    const v = Decimal(t);
    if (!v.isFinite()) {
      throw new Error(`expected numeric token but got "${t}"`);
    }
    numbers[idx] = v;
    idx += 1;
  }

  const to = indexToYm(idx - 1); // last mapped month
  return { from, to, numbers };
}

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

export function billSummary(
  address: string,
  years: number[],
  monthlyPricing: Record<number, MonthlyPrice>,
  powerUsage: PowerUsage,
) {
  const borderLeft = { styles: { borderLeft: "2px solid #6b7280" } };
  const months = range(1, 12);
  const totalsByYear: Record<number, YearTotal> = {};
  const billRows = months.map((month) =>
    tr(
      td(month),
      years.map((year) => {
        const index = ymToIndex({ year, month });
        const price = monthlyPricing[index];
        const prevPrice: MonthlyPrice = monthlyPricing[index - 1] || price;
        const power = powerUsage.numbers[index];
        const monthlyFee = price.monthlyFee;
        if (power) {
          const mWPrice = power.mul(price.mWPrice);
          const totalsForThisYear = totalsByYear[year];
          if (totalsForThisYear) {
            totalsForThisYear.mWPrice = totalsForThisYear.mWPrice.add(mWPrice);
            totalsForThisYear.monthlyFee = totalsForThisYear.monthlyFee.add(monthlyFee);
            totalsForThisYear.monthCount = totalsForThisYear.monthCount + 1;
            totalsForThisYear.totalEnergy = totalsForThisYear.totalEnergy.add(power);
          } else {
            totalsByYear[year] = { mWPrice, monthlyFee, monthCount: 1, totalEnergy: power };
          }
          return [
            td(printPower(power), borderLeft),
            td(printMoney(price.mWPrice), styles(showIncrease(price.mWPrice.sub(prevPrice.mWPrice).toNumber()))),
            td(printMoney(mWPrice)),
            td(printMoney(monthlyFee), styles(showIncrease(price.monthlyFee.sub(prevPrice.monthlyFee).toNumber()))),
            td(b(printMoney(mWPrice.add(monthlyFee)))),
          ];
        } else {
          return [td("-", borderLeft), td("-"), td("-"), td("-"), td("-")];
        }
      }),
    ),
  );
  return {
    bills: div(
      h2(`${address} laskut ${years[0]}-${years[years.length - 1]}`),
      table(
        styles({ width: "auto" }),
        thead(
          tr(
            th({ rowSpan: 2 }),
            years.map((y) => th(y, { colSpan: 5, ...borderLeft })),
          ),
          tr(years.map((y) => [th("Kulutus", borderLeft), th("€/MWh"), th("Energia €"), th("kk €"), th("Lasku €")])),
        ),
        tbody(
          billRows,
          tr(
            td(b("Yhteensä")),
            years.map((y) => {
              const { monthlyFee, mWPrice, totalEnergy } = totalsByYear[y];
              return [
                td(b(printPower(totalEnergy)), borderLeft),
                td(),
                td(b(printMoney(mWPrice))),
                td(b(printMoney(monthlyFee))),
                td(b(printMoney(monthlyFee.add(mWPrice)))),
              ];
            }),
          ),
        ),
      ),
    ),
    totalsByYear,
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
    const excessBilling = totalWithThisYearLevel.minus(totalWithPrevYearLevel.add(150));
    if (priceIncreaseTooMuch) {
      adjustedPricing[y] = adjusted;
      excessBillingAll[y] = excessBilling;
    }
    const princeIncreaseInfo = priceIncreaseTooMuch
      ? [
          li("Korotus ylittää 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e"),
          ul(
            li(
              `Liika laskutus: ${printMoney(totalWithThisYearLevel)} - (${printMoney(totalWithPrevYearLevel)} + 150) = `,
              b(printMoney(excessBilling)),
            ),
          ),
        ]
      : [li("Korotus ei ylitä 150e ja 15%")];
    const explainAdjustment =
      priceIncreaseTooMuch &&
      y !== years[years.length - 1] &&
      p(
        "Koska vuositasoista laskua piti korjata, seuraavan vuoden laskutuksessa käytetään tämän vuoden tasona viimevuoden tasoa * korjausprosentti",
        ul(
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
      h3(`${y}, vertaillaan toteutuneella ja ${prevYear} tasolla`),
      p(
        `Edellisen vuoden (${y - 1}) taso`,
        ul(
          adjustedPricingForPreviousYear && li("Käytetään korjattua tasoa"),
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
  monthlyPricing: Record<number, MonthlyPrice>,
  powerUsage: PowerUsage,
) {
  let excessTotal = Decimal(0);
  let interestTotal = Decimal(0);
  return table(
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
      excessYears.map((year) =>
        range(1, 12).map((month) => {
          const index = ymToIndex({ year, month });
          const power = powerUsage.numbers[index];
          const originalMonthlyPricing = monthlyPricing[index];
          const adjustedMonthlyPricing = adjustedPricing[year];
          const originalTotal = power.mul(originalMonthlyPricing.mWPrice).plus(originalMonthlyPricing.monthlyFee);
          const adjustedTotal = power
            .mul(adjustedMonthlyPricing.mWPrice.div(adjustedMonthlyPricing.totalEnergy))
            .plus(adjustedMonthlyPricing.monthlyFee.div(adjustedMonthlyPricing.monthCount));
          const excess = originalTotal.minus(adjustedTotal);
          const interestMultiplier = calculateViivastyskorkoMultiplier(
            toDateISO(`${year}-${month}-1`),
            toDateISO(`${year}-${month}-1`),
            true,
          );
          const interest = excess.mul(Decimal(interestMultiplier.multiplier).minus(1));
          excessTotal = excessTotal.add(excess);
          interestTotal = interestTotal.add(interest);
          return tr(
            td(`${year}.${month}`),
            td(printPower(power)),
            td(printMoney(originalTotal)),
            td(printMoney(adjustedTotal)),
            td(printMoney(excess)),
            td(printMoney(interest)),
          );
        }),
      ),
      tr(td("Yhteensä"), td(), td(), td(), td(printMoney(excessTotal)), td(printMoney(interestTotal))),
    ),
  );
}

export function evaluatePriceIncreases(
  address: string,
  years: number[],
  totalsByYear: Record<number, YearTotal>,
  monthlyPricing: Record<number, MonthlyPrice>,
  powerUsage: PowerUsage,
) {
  const comparedYears = years.slice(1);
  const adjustedPricing: Record<number, AdjustedYearTotal> = {};
  const excessBillingAll: Record<number, Decimal> = {};
  const yearComparison = compareYears(comparedYears, adjustedPricing, totalsByYear, excessBillingAll, years);
  const excessYears = comparedYears.filter((y) => excessBillingAll[y]);
  return div(
    h2("Korotusten arviointi"),
    div({ class: "pagebreak" }, yearComparison),
    Object.keys(excessBillingAll).length > 0 && [
      h2("Liiallinen laskutus ja viivästyskorko"),
      ul(
        excessYears.map((y) => li(`${y}: ${printMoney(excessBillingAll[y])}€`)),
        li(`Yhteensä: ${printMoney(Object.values(excessBillingAll).reduce((acc, v) => acc.add(v), Decimal(0)))}€`),
      ),
      p(
        "Viivästyskorko lasketaan korjattujen kuukausien laskujen maksupäivästä. Käytännössä siloin on laskutettu liikaa, jolloin rahaa on kerätty perusteettomasti",
      ),
      excessBillingPaybackInterest(excessYears, adjustedPricing, monthlyPricing, powerUsage),
    ],
  );
}
