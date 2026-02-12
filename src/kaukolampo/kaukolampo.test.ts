import { describe, expect, it } from "vitest";
import { resolveMonthlyPricingLookup } from "./kaukolampo";
import { tulaPepi } from "./kaukolampoPricing";

describe(resolveMonthlyPricingLookup, () => {
  it("simple", () => {
    expect(resolveMonthlyPricingLookup(tulaPepi, { year: 2025, month: 1 }, { year: 2025, month: 1 })).toEqual({
      24300: {
        mWPrice: 90.2,
        monthlyFee: 59.55,
      },
    });
    expect(resolveMonthlyPricingLookup(tulaPepi, { year: 2025, month: 2 }, { year: 2025, month: 2 })).toEqual({
      24301: {
        mWPrice: 90.2,
        monthlyFee: 59.55,
      },
    });
    expect(resolveMonthlyPricingLookup(tulaPepi, { year: 2024, month: 12 }, { year: 2024, month: 12 })).toEqual({
      24299: {
        mWPrice: 90.2,
        monthlyFee: 46.44,
      },
    });
  });
});
