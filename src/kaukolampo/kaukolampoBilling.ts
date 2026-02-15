import type {
  AdjustedYearTotal,
  ContractPricing,
  MonthBillInfo,
  MonthlyPrice,
  YearMonth,
  YearTotal
} from "./kaukolampoTypes";
import {isDefined} from "../../../ki-frame/src/util/typeUtils";
import Decimal from "decimal.js";
import {range} from "./range";
import {calculateViivastyskorkoMultiplier, toDateISO} from "./viivastyskorko";

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

export const months = range(1, 12);

export function calculateMonthlyYearBillTotals(
  years: number[],
  monthlyPricing: Record<number, MonthlyPrice>,
  powerUsage: Record<number, Decimal>,
) {
  const totalsByYear: Record<number, YearTotal> = {};
  const monthSummary: Record<number, MonthBillInfo> = {};
  years.forEach((year) => {
    const yearTotal: YearTotal = {
      mWPrice: Decimal(0),
      monthCount: 0,
      monthlyFee: Decimal(0),
      totalEnergy: Decimal(0),
    };
    months.forEach((month) => {
      const index = ymToIndex({ year, month });
      const price = monthlyPricing[index];
      const prevPrice: MonthlyPrice = monthlyPricing[index - 1] || price;
      const power = powerUsage[index];
      if (power) {
        const powerPrice = power.mul(price.mWPrice);
        yearTotal.mWPrice = yearTotal.mWPrice.add(powerPrice);
        yearTotal.monthlyFee = yearTotal.monthlyFee.add(price.monthlyFee);
        yearTotal.monthCount = yearTotal.monthCount + 1;
        yearTotal.totalEnergy = yearTotal.totalEnergy.add(power);
        monthSummary[index] = {
          ...price,
          power,
          powerPrice,
          monthlyMWPriceHasIncreased: price.mWPrice.sub(prevPrice.mWPrice).toNumber(),
          monthlyFeeHasIncreased: price.monthlyFee.sub(prevPrice.monthlyFee).toNumber(),
        };
      }
    });
    totalsByYear[year] = yearTotal;
  });
  return { totalsByYear, monthSummary };
}

export function calculatePaybackInterest(
  excessYears: number[],
  originalBills: Record<number, MonthBillInfo>,
  adjustedPricing: Record<number, AdjustedYearTotal>,
) {
  let excessTotal = Decimal(0);
  let paybackInterestTotal = Decimal(0);
  const months = excessYears.flatMap((year) =>
    range(1, 12).map((month) => {
      const index = ymToIndex({ year, month });
      const originalBill = originalBills[index];
      const adjustedMonthlyPricing = adjustedPricing[year];
      const originalTotal = originalBill.power.mul(originalBill.mWPrice).plus(originalBill.monthlyFee);
      const adjustedTotal = originalBill.power
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
      paybackInterestTotal = paybackInterestTotal.add(interest);
      return {
        date: `${year}.${month}`,
        originalBill,
        originalTotal,
        adjustedTotal,
        excess,
        interest,
      };
    }),
  );
  return { excessTotal, paybackInterestTotal, months };
}