import type Decimal from "decimal.js";

export type YearMonth = { year: number; month: number }; // month: 1..12

export type MonthlyPrice = {
  monthlyFee: Decimal;
  mWPrice: Decimal;
};

export type ContractPricing = {
  id: string;
  companyName: string;
  contractTypeName: string;
  monthlyPricing: (YearMonth & {
    price?: {
      monthlyFee: number;
      mWPrice: number;
    };
  })[];
};

export type PowerUsage = {
  from: YearMonth;
  to: YearMonth;
  numbers: Record<number, Decimal>;
};

export type YearTotal = MonthlyPrice & {
  monthCount: number;
  totalEnergy: Decimal;
};

export type AdjustedYearTotal = YearTotal & {
  adjustment: Decimal;
};
