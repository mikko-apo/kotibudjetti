import { describe, expect, it } from 'vitest'
import { calculateOsakkeet, type OsakkeetFormData } from './osakkeetCalculator'

function createBaseForm(overrides: Partial<OsakkeetFormData> = {}): OsakkeetFormData {
  return {
    subscriptions: [
      { id: 's1', date: '01.01.2013', amount: '100', totalPrice: '100' },
      { id: 's2', date: '01.01.2022', amount: '50', totalPrice: '200' },
    ],
    reimbursements: [],
    mathematicalShareValues: [
      { id: 'm1', year: '2024', valuePerShare: '20' },
      { id: 'm2', year: '2025', valuePerShare: '20' },
      { id: 'm3', year: '2026', valuePerShare: '20' },
    ],
    ipo: {
      ipoDate: '2026-06-01',
      totalShareCount: '150',
      totalIpoCost: '30',
      currentShareValue: '12',
      estimatedPreIpoValue: '1500',
      estimatedSecondaryShareSellPercentage: '20',
    },
    sell: {
      amount: '0',
    },
    ...overrides,
  }
}

describe(calculateOsakkeet, () => {
  it('splits reimbursements into capital repayments and dividends lot by lot', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        reimbursements: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.reimbursements).toHaveLength(1)
    expect(result.reimbursements[0].capitalRepaymentTotal.toFixed(2)).toBe('100.00')
    expect(result.reimbursements[0].dividendTotal.toFixed(2)).toBe('200.00')
    expect(result.subscriptions[0].reimbursementGrossTotal.toFixed(2)).toBe('200.00')
    expect(result.subscriptions[1].reimbursementGrossTotal.toFixed(2)).toBe('100.00')
    expect(result.subscriptions[0].capitalRepaymentPerShare.toFixed(2)).toBe('0.00')
    expect(result.subscriptions[1].capitalRepaymentPerShare.toFixed(2)).toBe('2.00')
    expect(result.subscriptions[1].remainingCostPerShare.toFixed(2)).toBe('2.00')
  })

  it('treats reimbursements on or after ipo date as dividends', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        reimbursements: [{ id: 'r1', type: 'dividend', date: '2026-06-01', amountPerShare: '1' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.reimbursements[0].treatedAsListedDividend).toBe(true)
    expect(result.reimbursements[0].capitalRepaymentTotal.toFixed(2)).toBe('0.00')
    expect(result.reimbursements[0].dividendTotal.toFixed(2)).toBe('150.00')
  })

  it('uses fifo lots and picks the more beneficial deduction method per lot', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        reimbursements: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        sell: { amount: '120' },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.sell.usedSubscriptions).toHaveLength(2)
    expect(result.sell.usedSubscriptions[0].subscriptionId).toBe('s1')
    expect(result.sell.usedSubscriptions[0].selectedMethod).toBe('Hankintameno-olettama 40 %')
    expect(result.sell.usedSubscriptions[1].subscriptionId).toBe('s2')
    expect(result.sell.usedSubscriptions[1].selectedMethod).toBe('Todellinen hankintameno + IPO-kulut')
    expect(result.sell.grossTotal.toFixed(2)).toBe('1200.00')
    expect(result.sell.totalIpoCostAllocated.toFixed(2)).toBe('120.00')
    expect(result.sell.taxableGainTotal.toFixed(2)).toBe('740.00')
    expect(result.sell.estimatedTax.toFixed(2)).toBe('222.00')
    expect(result.sell.netAfterTaxAndIpoCost.toFixed(2)).toBe('858.00')
  })

  it('calculates current total value from current share value', () => {
    const result = calculateOsakkeet(createBaseForm())

    expect(result.errors).toEqual([])
    expect(result.ipo.currentShareValue.toFixed(2)).toBe('12.00')
    expect(result.ipo.currentTotalValue.toFixed(2)).toBe('1800.00')
    expect(result.ipo.ipoPricePerShare.toFixed(2)).toBe('10.00')
    expect(result.ipo.increasePercentage.toFixed(2)).toBe('120.00')
    expect(result.ipo.increaseMultiplier.toFixed(2)).toBe('1.20')
  })
})
