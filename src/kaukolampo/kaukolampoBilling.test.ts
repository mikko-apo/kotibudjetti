import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { calculateMonthlyYearlyTotals, resolveMonthlyPricingLookup, ymToIndex } from './kaukolampoBilling'
import type { ContractPricing, MonthlyPrice } from './kaukolampoTypes'
import { tuusulanjarvenLampo } from './prices/tuusulanjarvenLampo'

function expectMoney(actual: Decimal, expected: string) {
  expect(actual.toFixed(2)).toBe(expected)
}

function expectPower(actual: Decimal, expected: string) {
  expect(actual.toFixed(3)).toBe(expected)
}

describe(resolveMonthlyPricingLookup, () => {
  it('uses the latest effective contract price for each month', () => {
    const result = resolveMonthlyPricingLookup(tuusulanjarvenLampo, { year: 2024, month: 12 }, { year: 2025, month: 7 })

    expectMoney(result[ymToIndex({ year: 2024, month: 12 })].monthlyFee, '46.44')
    expectMoney(result[ymToIndex({ year: 2024, month: 12 })].powerPrice, '90.20')
    expectMoney(result[ymToIndex({ year: 2025, month: 1 })].monthlyFee, '59.55')
    expectMoney(result[ymToIndex({ year: 2025, month: 1 })].powerPrice, '90.20')
    expectMoney(result[ymToIndex({ year: 2025, month: 7 })].monthlyFee, '59.55')
    expectMoney(result[ymToIndex({ year: 2025, month: 7 })].powerPrice, '86.04')
  })

  it('throws when the range starts before the contract pricing starts', () => {
    expect(() =>
      resolveMonthlyPricingLookup(tuusulanjarvenLampo, { year: 2021, month: 12 }, { year: 2022, month: 1 })
    ).toThrow(/not in the range of contract prices/)
  })
})

describe(calculateMonthlyYearlyTotals, () => {
  it('calculates billed totals and monthly deltas from monthly pricing and power usage', () => {
    const monthlyPricing: Record<number, MonthlyPrice> = {
      [ymToIndex({ year: 2024, month: 1 })]: {
        monthlyFee: Decimal(10),
        powerPrice: Decimal(100),
      },
      [ymToIndex({ year: 2024, month: 2 })]: {
        monthlyFee: Decimal(12),
        powerPrice: Decimal(110),
      },
    }
    const powerUsage = {
      [ymToIndex({ year: 2024, month: 1 })]: Decimal('1.5'),
      [ymToIndex({ year: 2024, month: 2 })]: Decimal('2'),
    }

    const { totalsByYear, monthSummary } = calculateMonthlyYearlyTotals([2024], monthlyPricing, powerUsage)

    expectPower(totalsByYear[2024].usedPower, '3.500')
    expect(totalsByYear[2024].monthCount).toBe(2)
    expectMoney(totalsByYear[2024].billedTotals.usedPowerPrice, '370.00')
    expectMoney(totalsByYear[2024].billedTotals.monthlyFees, '22.00')
    expectMoney(totalsByYear[2024].billedTotals.total, '392.00')
    expectMoney(totalsByYear[2024].calculatedTotals.avgPowerPrice, '105.71')
    expectMoney(totalsByYear[2024].calculatedTotals.avgMonthlyFee, '11.00')

    const january = monthSummary[ymToIndex({ year: 2024, month: 1 })]
    const february = monthSummary[ymToIndex({ year: 2024, month: 2 })]
    expectMoney(january.total, '160.00')
    expect(january.mWPriceDelta).toBe(0)
    expect(january.monthlyFeeDelta).toBe(0)
    expectMoney(february.total, '232.00')
    expect(february.mWPriceDelta).toBe(10)
    expect(february.monthlyFeeDelta).toBe(2)
  })

  it('caps calculated totals when increase exceeds both 150 euros and 15 percent', () => {
    const monthlyPricing: Record<number, MonthlyPrice> = {
      [ymToIndex({ year: 2024, month: 1 })]: {
        monthlyFee: Decimal(100),
        powerPrice: Decimal(100),
      },
      [ymToIndex({ year: 2025, month: 1 })]: {
        monthlyFee: Decimal(200),
        powerPrice: Decimal(200),
      },
    }
    const powerUsage = {
      [ymToIndex({ year: 2024, month: 1 })]: Decimal(1),
      [ymToIndex({ year: 2025, month: 1 })]: Decimal(1),
    }

    const { totalsByYear } = calculateMonthlyYearlyTotals([2024, 2025], monthlyPricing, powerUsage)

    expectMoney(totalsByYear[2024].billedTotals.total, '200.00')
    expectMoney(totalsByYear[2025].billedTotals.total, '400.00')
    expectMoney(totalsByYear[2025].totalsBasedOnLastYearLevel!.total, '200.00')
    expect(totalsByYear[2025].calculatedTotals.priceIncreaseTooMuch).toBe(true)
    expectMoney(totalsByYear[2025].calculatedTotals.priceIncreaseEuros!, '200.00')
    expectMoney(totalsByYear[2025].calculatedTotals.priceIncreasePercents!, '100.00')
    expectMoney(totalsByYear[2025].calculatedTotals.total, '350.00')
    expectMoney(totalsByYear[2025].calculatedTotals.excessBilling, '50.00')
    expect(totalsByYear[2025].calculatedTotals.adjustmentMultiplier!.toFixed(2)).toBe('1.75')
    expectMoney(totalsByYear[2025].calculatedTotals.avgMonthlyFee, '175.00')
    expectMoney(totalsByYear[2025].calculatedTotals.avgPowerPrice, '175.00')
  })

  it('keeps actual billed totals when increase stays within the rule threshold', () => {
    const monthlyPricing: Record<number, MonthlyPrice> = {
      [ymToIndex({ year: 2024, month: 1 })]: {
        monthlyFee: Decimal(100),
        powerPrice: Decimal(100),
      },
      [ymToIndex({ year: 2025, month: 1 })]: {
        monthlyFee: Decimal(140),
        powerPrice: Decimal(120),
      },
    }
    const powerUsage = {
      [ymToIndex({ year: 2024, month: 1 })]: Decimal(1),
      [ymToIndex({ year: 2025, month: 1 })]: Decimal(1),
    }

    const { totalsByYear } = calculateMonthlyYearlyTotals([2024, 2025], monthlyPricing, powerUsage)

    expectMoney(totalsByYear[2025].billedTotals.total, '260.00')
    expectMoney(totalsByYear[2025].totalsBasedOnLastYearLevel!.total, '200.00')
    expect(totalsByYear[2025].calculatedTotals.priceIncreaseTooMuch).toBeUndefined()
    expectMoney(totalsByYear[2025].calculatedTotals.priceIncreaseEuros!, '60.00')
    expectMoney(totalsByYear[2025].calculatedTotals.priceIncreasePercents!, '30.00')
    expectMoney(totalsByYear[2025].calculatedTotals.excessBilling, '0.00')
    expectMoney(totalsByYear[2025].calculatedTotals.total, '260.00')
  })
})

describe(calculateMonthlyYearlyTotals, () => {
  it('uses carried-forward contract prices in annual totals', () => {
    const contract: ContractPricing = {
      id: 'test-contract',
      companyName: 'Test Heat',
      contractTypeName: 'Base',
      monthlyPricing: [
        {
          year: 2024,
          month: 1,
          price: {
            monthlyFee: 50,
            powerPricePerMW: 100,
          },
        },
        {
          year: 2024,
          month: 3,
          price: {
            monthlyFee: 60,
            powerPricePerMW: 120,
          },
        },
      ],
    }
    const pricing = resolveMonthlyPricingLookup(contract, { year: 2024, month: 1 }, { year: 2024, month: 3 })
    const powerUsage = {
      [ymToIndex({ year: 2024, month: 1 })]: Decimal(1),
      [ymToIndex({ year: 2024, month: 2 })]: Decimal(1),
      [ymToIndex({ year: 2024, month: 3 })]: Decimal(1),
    }

    const { totalsByYear } = calculateMonthlyYearlyTotals([2024], pricing, powerUsage)

    expectMoney(totalsByYear[2024].billedTotals.usedPowerPrice, '320.00')
    expectMoney(totalsByYear[2024].billedTotals.monthlyFees, '160.00')
    expectMoney(totalsByYear[2024].billedTotals.total, '480.00')
  })
})
