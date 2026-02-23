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
  index: number;
  usedPower: Decimal;
  usedPowerPrice: Decimal;
  total: Decimal;
  monthlyFeeDelta: number;
  mWPriceDelta: number;
};

export type PaybackInterestMonth = {
  month: number;
  originalBill: MonthBillInfo;
  excessFromAveragePrices: MonthlyPrice & {
    usedPowerPrice: Decimal;
    total: Decimal;
    excess: Decimal;
    interest: Decimal;
  };
  excessComparingToPreviousYearAnd150Buffer: MonthlyPrice & {
    usedPowerPrice: Decimal;
    totalWithLastYearLevel: Decimal;
    total: Decimal;
    excess: Decimal;
    interest: Decimal;
    leftFrom150: Decimal;
  };
};

export type InterestTypeTotals = {
  total: Decimal;
  excess: Decimal;
  interest: Decimal;
};

export type PaybackInterestYear = {
  year: number;
  months: PaybackInterestMonth[];
  billedTotal: Decimal;
  fromAveragePricesTotals: InterestTypeTotals;
  comparingToPreviousYearAnd150BufferTotals: InterestTypeTotals;
};
