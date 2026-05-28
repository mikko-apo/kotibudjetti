import Decimal from 'decimal.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateValues, resolveMonthlyPricingLookup, ymToIndex } from './kaukolampoBilling'
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

describe(calculateValues, () => {
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

    const { totalsByYear, monthBillInfos } = calculateValues([2024], monthlyPricing, powerUsage)

    expectPower(totalsByYear[2024].usedPower, '3.500')
    expect(totalsByYear[2024].monthCount).toBe(2)
    expectMoney(totalsByYear[2024].billedTotals.usedPowerPrice, '370.00')
    expectMoney(totalsByYear[2024].billedTotals.monthlyFees, '22.00')
    expectMoney(totalsByYear[2024].billedTotals.total, '392.00')
    expectMoney(totalsByYear[2024].calculatedTotals.avgPowerPrice, '105.71')
    expectMoney(totalsByYear[2024].calculatedTotals.avgMonthlyFee, '11.00')

    const january = monthBillInfos[ymToIndex({ year: 2024, month: 1 })]
    const february = monthBillInfos[ymToIndex({ year: 2024, month: 2 })]
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

    const { totalsByYear } = calculateValues([2024, 2025], monthlyPricing, powerUsage)

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

    const { totalsByYear } = calculateValues([2024, 2025], monthlyPricing, powerUsage)

    expectMoney(totalsByYear[2025].billedTotals.total, '260.00')
    expectMoney(totalsByYear[2025].totalsBasedOnLastYearLevel!.total, '200.00')
    expect(totalsByYear[2025].calculatedTotals.priceIncreaseTooMuch).toBeUndefined()
    expectMoney(totalsByYear[2025].calculatedTotals.priceIncreaseEuros!, '60.00')
    expectMoney(totalsByYear[2025].calculatedTotals.priceIncreasePercents!, '30.00')
    expectMoney(totalsByYear[2025].calculatedTotals.excessBilling, '0.00')
    expectMoney(totalsByYear[2025].calculatedTotals.total, '260.00')
  })
})

describe(calculateValues, () => {
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

    const { totalsByYear } = calculateValues([2024], pricing, powerUsage)

    expectMoney(totalsByYear[2024].billedTotals.usedPowerPrice, '320.00')
    expectMoney(totalsByYear[2024].billedTotals.monthlyFees, '160.00')
    expectMoney(totalsByYear[2024].billedTotals.total, '480.00')
  })
})

describe('payback interest calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies the 150 euro buffer month by month before calculating interest', () => {
    const monthlyPricing: Record<number, MonthlyPrice> = {
      [ymToIndex({ year: 2024, month: 1 })]: {
        monthlyFee: Decimal(100),
        powerPrice: Decimal(100),
      },
      [ymToIndex({ year: 2024, month: 2 })]: {
        monthlyFee: Decimal(100),
        powerPrice: Decimal(100),
      },
      [ymToIndex({ year: 2025, month: 1 })]: {
        monthlyFee: Decimal(250),
        powerPrice: Decimal(150),
      },
      [ymToIndex({ year: 2025, month: 2 })]: {
        monthlyFee: Decimal(250),
        powerPrice: Decimal(150),
      },
    }
    const powerUsage = {
      [ymToIndex({ year: 2024, month: 1 })]: Decimal(1),
      [ymToIndex({ year: 2024, month: 2 })]: Decimal(1),
      [ymToIndex({ year: 2025, month: 1 })]: Decimal(1),
      [ymToIndex({ year: 2025, month: 2 })]: Decimal(1),
    }

    const { excessYears, paybackInterestYears } = calculateValues([2024, 2025], monthlyPricing, powerUsage)

    expect(excessYears).toEqual([2025])
    expect(paybackInterestYears).toHaveLength(1)

    const [interestYear] = paybackInterestYears
    const [january, february] = interestYear.months
    expect(interestYear.year).toBe(2025)
    expectMoney(interestYear.billedTotal, '800.00')
    expectMoney(interestYear.fromAveragePricesTotals.total, '550.00')
    expectMoney(interestYear.fromAveragePricesTotals.excess, '250.00')
    expectMoney(interestYear.fromAveragePricesTotals.interest, '3.43')
    expectMoney(interestYear.comparingToPreviousYearAnd150BufferTotals.total, '550.00')
    expectMoney(interestYear.comparingToPreviousYearAnd150BufferTotals.excess, '250.00')
    expectMoney(interestYear.comparingToPreviousYearAnd150BufferTotals.interest, '2.69')

    expect(january.month).toBe(1)
    expectMoney(january.excessComparingToPreviousYearAnd150Buffer.totalWithLastYearLevel, '200.00')
    expectMoney(january.excessComparingToPreviousYearAnd150Buffer.total, '350.00')
    expectMoney(january.excessComparingToPreviousYearAnd150Buffer.excess, '50.00')
    expectMoney(january.excessComparingToPreviousYearAnd150Buffer.leftFrom150, '0.00')

    expect(february.month).toBe(2)
    expectMoney(february.excessComparingToPreviousYearAnd150Buffer.totalWithLastYearLevel, '200.00')
    expectMoney(february.excessComparingToPreviousYearAnd150Buffer.total, '200.00')
    expectMoney(february.excessComparingToPreviousYearAnd150Buffer.excess, '200.00')
  })
})
