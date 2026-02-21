import type Decimal from "decimal.js";

export type YearMonth = { year: number; month: number }; // month: 1..12

export type MonthlyPrice = {
  monthlyFee: Decimal;
  powerPrice: Decimal;
};

export type ContractPricing = {
  id: string;
  companyName: string;
  contractTypeName: string;
  monthlyPricing: (YearMonth & {
    price?: {
      monthlyFee: number;
      powerPricePerMW: number;
    };
  })[];
};

export type UnpackedPowerUsage = {
  from: YearMonth;
  to: YearMonth;
  numbers: Record<number, Decimal>;
};

type AvgPricing = {
  avgMonthlyFee: Decimal;
  avgPowerPrice: Decimal;
};

export type YearTotalTotals = {
  usedPowerPrice: Decimal;
  monthlyFees: Decimal;
  total: Decimal;
};
export type YearTotal = {
  usedPower: Decimal;
  monthCount: number;
  billedTotals: YearTotalTotals;
  totalsBasedOnLastYearLevel?: YearTotalTotals;
  calculatedTotals: YearTotalTotals & {
    comparedToPreviousYear: boolean;
    avgMonthlyFee: Decimal;
    avgPowerPrice: Decimal;
    excessBilling: Decimal;
    adjustmentMultiplier?: Decimal;
    priceIncreaseTooMuch?: boolean;
    priceIncreasePercents?: Decimal;
    priceIncreaseEuros?: Decimal;
  };
};

export type MonthBillInfo = MonthlyPrice & {
  usedPower: Decimal;
  usedPowerPrice: Decimal;
  total: Decimal;
  monthlyFeeDelta: number;
  monthlyMWPriceDelta: number;
};
