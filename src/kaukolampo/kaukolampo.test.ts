import { describe, expect, it } from "vitest";
import { resolveMonthlyPricingLookup } from "./kaukolampoBilling";
import { tuusulanjarvenLampo } from "./prices/tuusulanjarvenLampo";

describe(resolveMonthlyPricingLookup, () => {
  it("simple", () => {
    expect(
      resolveMonthlyPricingLookup(tuusulanjarvenLampo, { year: 2025, month: 1 }, { year: 2025, month: 1 }),
    ).toEqual({
      24300: {
        mWPrice: 90.2,
        monthlyFee: 59.55,
      },
    });
    expect(
      resolveMonthlyPricingLookup(tuusulanjarvenLampo, { year: 2025, month: 2 }, { year: 2025, month: 2 }),
    ).toEqual({
      24301: {
        mWPrice: 90.2,
        monthlyFee: 59.55,
      },
    });
    expect(
      resolveMonthlyPricingLookup(tuusulanjarvenLampo, { year: 2024, month: 12 }, { year: 2024, month: 12 }),
    ).toEqual({
      24299: {
        mWPrice: 90.2,
        monthlyFee: 46.44,
      },
    });
  });
});
