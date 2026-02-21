import Decimal from "decimal.js";
import { isDefined } from "../../../ki-frame/src/util/typeUtils";
import type {
  ContractPricing,
  MonthBillInfo,
  MonthlyPrice,
  YearMonth,
  YearTotal,
  YearTotalTotals,
} from "./kaukolampoTypes";
import { range } from "./range";
import { calculateViivastyskorkoMultiplier, toDateISO } from "./viivastyskorko";

export const ymToIndex = (ym: YearMonth) => ym.year * 12 + (ym.month - 1);
export const indexToYm = (idx: number): YearMonth => {
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
      const { monthlyFee, powerPricePerMW } = firstLower.price;
      result[c] = {
        monthlyFee: Decimal(monthlyFee),
        powerPrice: Decimal(powerPricePerMW),
      };
    } else {
      throw new Error(`${indexToYm(c)} is not in the range of contract prices for ${contract.id}`);
    }
  }
  return result;
}

export const months = range(1, 12);

export function calculateMonthlyYearlyTotals(
  years: number[],
  monthlyPricing: Record<number, MonthlyPrice>,
  powerUsage: Record<number, Decimal>,
) {
  const totalsByYear: Record<number, YearTotal> = {};
  const monthSummary: Record<number, MonthBillInfo> = {};
  years.forEach((year, index) => {
    const yearTotal: YearTotal = {
      usedPower: Decimal(0),
      monthCount: 0,
      billedTotals: {
        usedPowerPrice: Decimal(0),
        monthlyFees: Decimal(0),
        total: Decimal(0),
      },
      calculatedTotals: {
        comparedToPreviousYear: true,
        usedPowerPrice: Decimal(0),
        monthlyFees: Decimal(0),
        total: Decimal(0),
        avgMonthlyFee: Decimal(0),
        avgPowerPrice: Decimal(0),
        excessBilling: Decimal(0),
      },
    };
    months.forEach((month) => {
      const index = ymToIndex({ year, month });
      const usedPower = powerUsage[index];
      if (usedPower) {
        const price = monthlyPricing[index];
        const usedPowerPrice = usedPower.mul(price.powerPrice);
        const prevPrice: MonthlyPrice = monthlyPricing[index - 1] || price;
        const total = usedPowerPrice.add(price.monthlyFee);
        monthSummary[index] = {
          ...price,
          usedPower,
          usedPowerPrice,
          monthlyMWPriceDelta: price.powerPrice.sub(prevPrice.powerPrice).toNumber(),
          monthlyFeeDelta: price.monthlyFee.sub(prevPrice.monthlyFee).toNumber(),
          total,
        };
        yearTotal.usedPower = yearTotal.usedPower.add(usedPower);
        const billedTotals = yearTotal.billedTotals;
        billedTotals.monthlyFees = billedTotals.monthlyFees.add(price.monthlyFee);
        billedTotals.usedPowerPrice = billedTotals.usedPowerPrice.add(usedPowerPrice);
        billedTotals.total = billedTotals.total.add(total);
        yearTotal.monthCount = yearTotal.monthCount + 1;
      }
    });
    // calculate mwPrice and monthlyFee averages over the year
    yearTotal.calculatedTotals = {
      ...yearTotal.billedTotals,
      comparedToPreviousYear: false,
      avgPowerPrice: yearTotal.billedTotals.usedPowerPrice.div(yearTotal.usedPower),
      avgMonthlyFee: yearTotal.billedTotals.monthlyFees.div(yearTotal.monthCount),
      excessBilling: Decimal(0),
    };

    // check if price has increased over limits
    if (index > 0) {
      const prevYear = year - 1;
      const prevTotals = totalsByYear[prevYear].calculatedTotals;
      const prevMonthlyFees = prevTotals.avgMonthlyFee.mul(yearTotal.monthCount);
      const prevUsedPowerPrice = yearTotal.usedPower.mul(prevTotals.avgPowerPrice);
      const totalsBasedOnLastYearLevel: YearTotalTotals = {
        monthlyFees: prevMonthlyFees,
        usedPowerPrice: prevUsedPowerPrice,
        total: prevMonthlyFees.add(prevUsedPowerPrice),
      };
      yearTotal.totalsBasedOnLastYearLevel = totalsBasedOnLastYearLevel;
      const billedTotal = yearTotal.billedTotals.total;
      const priceIncreaseEuros = billedTotal.minus(totalsBasedOnLastYearLevel.total);
      const priceIncreasePercents = billedTotal.div(totalsBasedOnLastYearLevel.total).minus(1).mul(100);
      const priceIncreaseTooMuch = priceIncreaseEuros.toNumber() > 150 && priceIncreasePercents.toNumber() > 15;
      if (priceIncreaseTooMuch) {
        const total = totalsBasedOnLastYearLevel.total.add(150);
        const adjustmentMultiplier = total.div(totalsBasedOnLastYearLevel.total);
        const avgMonthlyFee = prevTotals.avgMonthlyFee.mul(adjustmentMultiplier);
        const avgPowerPrice = prevTotals.avgPowerPrice.mul(adjustmentMultiplier);
        yearTotal.calculatedTotals = {
          usedPowerPrice: avgPowerPrice.mul(yearTotal.usedPower),
          monthlyFees: avgMonthlyFee.mul(yearTotal.monthCount),
          total,
          avgMonthlyFee,
          avgPowerPrice,
          adjustmentMultiplier,
          excessBilling: billedTotal.minus(total),
          comparedToPreviousYear: true,
          priceIncreaseTooMuch,
          priceIncreasePercents,
          priceIncreaseEuros,
        };
      } else {
        yearTotal.calculatedTotals.comparedToPreviousYear = true;
        yearTotal.calculatedTotals.priceIncreasePercents = priceIncreasePercents;
        yearTotal.calculatedTotals.priceIncreaseEuros = priceIncreaseEuros;
      }
    }

    totalsByYear[year] = yearTotal;
  });
  return { totalsByYear, monthSummary };
}

export function calculatePaybackInterest(
  excessYears: number[],
  originalBills: Record<number, MonthBillInfo>,
  totalsByYear: Record<number, YearTotal>,
) {
  let excessTotal = Decimal(0);
  let paybackInterestTotal = Decimal(0);
  const months = excessYears.flatMap((year) => {
    const yearTotal = totalsByYear[year].calculatedTotals;
    return range(1, 12).map((month) => {
      const index = ymToIndex({ year, month });
      const originalBill = originalBills[index];
      const originalTotal = originalBill.usedPower.mul(originalBill.powerPrice).plus(originalBill.monthlyFee);
      const adjustedTotal = originalBill.usedPower.mul(yearTotal.avgPowerPrice).plus(yearTotal.avgMonthlyFee);
      const excess = originalTotal.minus(adjustedTotal);
      const interestMultiplier = calculateViivastyskorkoMultiplier(
        toDateISO(`${year}-${month}-1`),
        toDateISO(`${year}-${month}-1`),
        true,
      );
      const interest = excess.mul(Decimal(interestMultiplier.multiplier).minus(1));
      excessTotal = excessTotal.add(excess);
      paybackInterestTotal = paybackInterestTotal.add(interest);
      return {
        date: `${year}.${month}`,
        originalBill,
        originalTotal,
        adjustedTotal,
        excess,
        interest,
      };
    });
  });
  return { excessTotal, paybackInterestTotal, months };
}
