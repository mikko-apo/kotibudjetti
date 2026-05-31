import { describe, expect, it } from 'vitest'
import { createShareCalculator } from './shareCalculator'

describe(createShareCalculator, () => {
  it('tracks remaining shares and acquisition cost through splits capital repayments and sells', () => {
    const { shareCalculator, errors } = createShareCalculator(
      [
        {
          id: 's1',
          date: '2022-01-01',
          amount: '100',
          pricePerShare: '4',
        },
      ],
      [
        {
          id: 'sell1',
          date: '2025-01-01',
          shareCount: '60',
          sellPrice: '720',
          pricePerShare: '12',
        },
      ],
      [
        {
          id: 'split1',
          date: '2023-01-01',
          multiplier: '2',
        },
      ],
      [
        {
          id: 'demerger1',
          date: '2024-01-01',
          oldCompanyRatio: '0.5',
        },
      ],
      [
        {
          id: 'cr1',
          date: '2024-06-01',
          type: 'capital_return',
          amountPerShare: '0.25',
        },
        {
          id: 'div1',
          date: '2024-08-01',
          type: 'dividend',
          amountPerShare: '0.4',
        },
      ]
    )

    expect(errors).toEqual([])

    const afterCapitalRepayment = shareCalculator.getRemainingCountAndAcquisitionCost('s1', '2024-06-01')
    expect(afterCapitalRepayment.remaining.shareCount.toFixed(2)).toBe('200.00')
    expect(afterCapitalRepayment.remaining.shareAcquisitionCost.toFixed(2)).toBe('150.00')
    expect(afterCapitalRepayment.log.map((entry) => entry.kind)).toEqual([
      'subscription',
      'companyShareCountChange',
      'companyAcquisitionCostChange',
      'capitalRepayment',
    ])

    const afterSell = shareCalculator.getRemainingCountAndAcquisitionCost('s1', '2025-01-01')
    expect(afterSell.remaining.shareCount.toFixed(2)).toBe('140.00')
    expect(afterSell.remaining.shareAcquisitionCost.toFixed(2)).toBe('105.00')

    const sellAllocation = shareCalculator.sellsForThisSubscriptionLotsBySubscriptionId.s1[0]
    expect(sellAllocation.soldShareCount.toFixed(2)).toBe('60.00')
    expect(sellAllocation.soldShareAcquisitionCost.toFixed(2)).toBe('45.00')
    expect(sellAllocation.soldBaseShareAcquisitionCost.toFixed(2)).toBe('60.00')
  })

  it('allows same-day structure changes without time precision', () => {
    const { errors } = createShareCalculator(
      [
        {
          id: 's1',
          date: '2024-01-01',
          amount: '10',
          totalPrice: '100',
        },
      ],
      [],
      [
        {
          id: 'split1',
          date: '2024-01-02T00:00:00Z',
          multiplier: '2',
        },
      ],
      [
        {
          id: 'demerger1',
          date: '02.01.2024',
          oldCompanyRatio: '0.8',
        },
      ]
    )

    expect(errors).toEqual([])
  })

  it('returns timestamp conflicts for mixed same-day events without time precision', () => {
    const { errors } = createShareCalculator(
      [
        {
          id: 's1',
          date: '2024-01-02',
          amount: '10',
          totalPrice: '100',
        },
      ],
      [
        {
          id: 'sell1',
          date: '02.01.2024',
          shareCount: '1',
          sellPrice: '20',
        },
      ],
      [],
      []
    )

    expect(errors.some((error) => error.kind === 'timestamp_conflict')).toBe(true)
  })

  it('logs capital returns that are redirected to dividend without changing remaining acquisition cost', () => {
    const { shareCalculator, errors } = createShareCalculator(
      [
        {
          id: 's1',
          date: '2022-01-01',
          amount: '10',
          pricePerShare: '1',
        },
      ],
      [],
      [],
      [],
      [
        {
          id: 'cr-old',
          date: '2033-01-02',
          type: 'capital_return',
          amountPerShare: '0.5',
        },
      ]
    )

    expect(errors).toEqual([])

    const result = shareCalculator.getRemainingCountAndAcquisitionCost('s1', '2033-01-02')
    expect(result.remaining.shareCount.toFixed(2)).toBe('10.00')
    expect(result.remaining.shareAcquisitionCost.toFixed(2)).toBe('10.00')
    expect(result.log.map((entry) => entry.kind)).toEqual(['subscription', 'capitalRepayment'])

    const capitalRepaymentEntry = result.log[1]
    expect(capitalRepaymentEntry.kind).toBe('capitalRepayment')
    if (capitalRepaymentEntry.kind !== 'capitalRepayment') {
      throw new Error('Expected capital repayment log entry')
    }
    expect(capitalRepaymentEntry.shareCountAtEvent.toFixed(2)).toBe('10.00')
    expect(capitalRepaymentEntry.appliedShareAcquisitionCost.toFixed(2)).toBe('0.00')
    expect(capitalRepaymentEntry.directedToDividendTotal.toFixed(2)).toBe('5.00')
    expect(capitalRepaymentEntry.dividendReason).toBe('too_old')
  })
})
