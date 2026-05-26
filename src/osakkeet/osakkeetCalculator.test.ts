import { describe, expect, it } from 'vitest'
import {
  OSAKKEET_TAX_RULES_2026,
  calculateOsakkeet,
  type OsakkeetFormData,
  type OsakkeetTaxRules,
} from './osakkeetCalculator'

function createBaseForm(overrides: Partial<OsakkeetFormData> = {}): OsakkeetFormData {
  return {
    subscriptions: [
      { id: 's1', date: '01.01.2013', vestingEndsOn: '', amount: '100', totalPrice: '100' },
      { id: 's2', date: '01.01.2022', vestingEndsOn: '', amount: '50', totalPrice: '200' },
    ],
    cashDistributions: [],
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

function decimalValue(value: { toFixed: (precision?: number) => string }) {
  return value.toFixed(2)
}

function snapshotCalculation(form: OsakkeetFormData) {
  const result = calculateOsakkeet(form)
  return {
    warnings: result.warnings,
    errors: result.errors,
    subscriptions: result.subscriptions.map((subscription) => ({
      id: subscription.id,
      date: subscription.date,
      amount: decimalValue(subscription.amount),
      totalPrice: decimalValue(subscription.totalPrice),
      cashDistributionGrossTotal: decimalValue(subscription.cashDistributionGrossTotal),
      capitalRepaymentPerShare: decimalValue(subscription.capitalRepaymentPerShare),
      remainingCostPerShare: decimalValue(subscription.remainingCostPerShare),
      remainingCostTotal: decimalValue(subscription.remainingCostTotal),
    })),
    cashDistributions: result.cashDistributions.map((cashDistribution) => ({
      id: cashDistribution.id,
      date: cashDistribution.date,
      type: cashDistribution.type,
      amountPerShare: decimalValue(cashDistribution.amountPerShare),
      sharesHeld: decimalValue(cashDistribution.sharesHeld),
      mathematicalShareValuePerShare: decimalValue(cashDistribution.mathematicalShareValuePerShare),
      shareholderMathematicalValue: decimalValue(cashDistribution.shareholderMathematicalValue),
      eightPercentYieldLimit: decimalValue(cashDistribution.eightPercentYieldLimit),
      expectedTotal: decimalValue(cashDistribution.expectedTotal),
      grossTotal: decimalValue(cashDistribution.grossTotal),
      paidInCash: decimalValue(cashDistribution.paidInCash),
      capitalRepaymentTotal: decimalValue(cashDistribution.capitalRepaymentTotal),
      dividendTotal: decimalValue(cashDistribution.dividendTotal),
      withholdingToTaxOffice: decimalValue(cashDistribution.withholdingToTaxOffice),
      taxableCapitalIncome: decimalValue(cashDistribution.taxableCapitalIncome),
      taxFreeCapitalIncomePortion: decimalValue(cashDistribution.taxFreeCapitalIncomePortion),
      taxableEarnedDividend: decimalValue(cashDistribution.taxableEarnedDividend),
      taxFreeEarnedDividend: decimalValue(cashDistribution.taxFreeEarnedDividend),
      treatedAsListedDividend: cashDistribution.treatedAsListedDividend,
      allocations: cashDistribution.allocations.map((allocation) => ({
        subscriptionId: allocation.subscriptionId,
        subscriptionDate: allocation.subscriptionDate,
        shares: decimalValue(allocation.shares),
        gross: decimalValue(allocation.gross),
        capitalRepayment: decimalValue(allocation.capitalRepayment),
        dividend: decimalValue(allocation.dividend),
        remainingCostPerShareAfter: decimalValue(allocation.remainingCostPerShareAfter),
        eligibleCapitalRepayment: allocation.eligibleCapitalRepayment,
      })),
    })),
    vesting: {
      totalShares: decimalValue(result.vesting.totalShares),
      vestedShares: decimalValue(result.vesting.vestedShares),
      unvestedShares: decimalValue(result.vesting.unvestedShares),
    },
    ipo: {
      ipoDate: result.ipo.ipoDate?.toISOString() || null,
      totalShareCount: decimalValue(result.ipo.totalShareCount),
      totalSubscribedShares: decimalValue(result.ipo.totalSubscribedShares),
      totalSubscribedCost: decimalValue(result.ipo.totalSubscribedCost),
      totalIpoCost: decimalValue(result.ipo.totalIpoCost),
      currentShareValue: decimalValue(result.ipo.currentShareValue),
      currentTotalValue: decimalValue(result.ipo.currentTotalValue),
      estimatedPreIpoValue: decimalValue(result.ipo.estimatedPreIpoValue),
      estimatedSecondaryShareSellPercentage: decimalValue(result.ipo.estimatedSecondaryShareSellPercentage),
      estimatedSecondaryShareCount: decimalValue(result.ipo.estimatedSecondaryShareCount),
      ipoPricePerShare: decimalValue(result.ipo.ipoPricePerShare),
      currentValuePerShare: decimalValue(result.ipo.currentValuePerShare),
      increasePercentage: decimalValue(result.ipo.increasePercentage),
      increaseMultiplier: decimalValue(result.ipo.increaseMultiplier),
      ipoCostPerShare: decimalValue(result.ipo.ipoCostPerShare),
    },
    sell: {
      amount: decimalValue(result.sell.amount),
      usedSubscriptions: result.sell.usedSubscriptions.map((subscription) => ({
        subscriptionId: subscription.subscriptionId,
        subscriptionDate: subscription.subscriptionDate,
        totalSubscriptionShares: decimalValue(subscription.totalSubscriptionShares),
        soldAmount: decimalValue(subscription.soldAmount),
        gross: decimalValue(subscription.gross),
        originalCostBasis: decimalValue(subscription.originalCostBasis),
        realCostBasis: decimalValue(subscription.realCostBasis),
        allocatedIpoCost: decimalValue(subscription.allocatedIpoCost),
        actualDeduction: decimalValue(subscription.actualDeduction),
        hankintamenoOlettaRate: decimalValue(subscription.hankintamenoOlettaRate),
        hankintamenoOlettaDeduction: decimalValue(subscription.hankintamenoOlettaDeduction),
        selectedMethod: subscription.selectedMethod,
        selectedDeduction: decimalValue(subscription.selectedDeduction),
        taxableGain: decimalValue(subscription.taxableGain),
        taxFreeGainPart: decimalValue(subscription.taxFreeGainPart),
        taxedGainPart: decimalValue(subscription.taxedGainPart),
      })),
      grossTotal: decimalValue(result.sell.grossTotal),
      cashAfterIpoCosts: decimalValue(result.sell.cashAfterIpoCosts),
      taxFreeAcquisitionRecoveryAfterIpoCosts: decimalValue(result.sell.taxFreeAcquisitionRecoveryAfterIpoCosts),
      soldShareOriginalCostTotal: decimalValue(result.sell.soldShareOriginalCostTotal),
      soldShareAcquisitionCostTotal: decimalValue(result.sell.soldShareAcquisitionCostTotal),
      selectedActualDeductionTotal: decimalValue(result.sell.selectedActualDeductionTotal),
      selectedHmo20DeductionTotal: decimalValue(result.sell.selectedHmo20DeductionTotal),
      selectedHmo40DeductionTotal: decimalValue(result.sell.selectedHmo40DeductionTotal),
      selectedDeductionTotal: decimalValue(result.sell.selectedDeductionTotal),
      totalIpoCostAllocated: decimalValue(result.sell.totalIpoCostAllocated),
      ipoCostDeductedViaActual: decimalValue(result.sell.ipoCostDeductedViaActual),
      ipoCostPaidWithoutActualDeduction: decimalValue(result.sell.ipoCostPaidWithoutActualDeduction),
      taxSavedFromDeductibleIpoCosts: decimalValue(result.sell.taxSavedFromDeductibleIpoCosts),
      taxableGainTotal: decimalValue(result.sell.taxableGainTotal),
      taxableGainAtLowRate: decimalValue(result.sell.taxableGainAtLowRate),
      taxableGainAtHighRate: decimalValue(result.sell.taxableGainAtHighRate),
      estimatedTax: decimalValue(result.sell.estimatedTax),
      netAfterTaxAndIpoCost: decimalValue(result.sell.netAfterTaxAndIpoCost),
      remainingUnsoldShares: decimalValue(result.sell.remainingUnsoldShares),
    },
  }
}

describe(calculateOsakkeet, () => {
  it('splits cash distributions into capital repayments and dividends lot by lot', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.cashDistributions).toHaveLength(1)
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('100.00')
    expect(result.cashDistributions[0].dividendTotal.toFixed(2)).toBe('200.00')
    expect(result.subscriptions[0].cashDistributionGrossTotal.toFixed(2)).toBe('200.00')
    expect(result.subscriptions[1].cashDistributionGrossTotal.toFixed(2)).toBe('100.00')
    expect(result.subscriptions[0].capitalRepaymentPerShare.toFixed(2)).toBe('0.00')
    expect(result.subscriptions[1].capitalRepaymentPerShare.toFixed(2)).toBe('2.00')
    expect(result.subscriptions[1].remainingCostPerShare.toFixed(2)).toBe('2.00')
  })

  it('treats cash distributions on or after ipo date as dividends', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'dividend', date: '2026-06-01', amountPerShare: '1' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.cashDistributions[0].treatedAsListedDividend).toBe(true)
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('0.00')
    expect(result.cashDistributions[0].dividendTotal.toFixed(2)).toBe('150.00')
  })

  it('uses fifo lots and picks the more beneficial deduction method per lot', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        sell: { amount: '120' },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.sell.usedSubscriptions).toHaveLength(2)
    expect(result.sell.usedSubscriptions[0].subscriptionId).toBe('s1')
    expect(result.sell.usedSubscriptions[0].selectedMethod).toBe('hmo')
    expect(result.sell.usedSubscriptions[1].subscriptionId).toBe('s2')
    expect(result.sell.usedSubscriptions[1].selectedMethod).toBe('actual_costs')
    expect(result.sell.grossTotal.toFixed(2)).toBe('1200.00')
    expect(result.sell.totalIpoCostAllocated.toFixed(2)).toBe('120.00')
    expect(result.sell.taxableGainTotal.toFixed(2)).toBe('740.00')
    expect(result.sell.estimatedTax.toFixed(2)).toBe('222.00')
    expect(result.sell.netAfterTaxAndIpoCost.toFixed(2)).toBe('858.00')
  })

  it('excludes vesting-restricted lots from the IPO sale allocation', () => {
    const result = calculateOsakkeet(
      createBaseForm({
        subscriptions: [
          { id: 's1', date: '01.01.2013', vestingEndsOn: '31.12.2026', amount: '100', totalPrice: '100' },
          { id: 's2', date: '01.01.2022', vestingEndsOn: '', amount: '50', totalPrice: '200' },
        ],
        sell: { amount: '60' },
      })
    )

    expect(result.sell.usedSubscriptions).toHaveLength(1)
    expect(result.sell.usedSubscriptions[0].subscriptionId).toBe('s2')
    expect(result.sell.usedSubscriptions[0].soldAmount.toFixed(2)).toBe('50.00')
    expect(result.vesting.totalShares.toFixed(2)).toBe('150.00')
    expect(result.vesting.vestedShares.toFixed(2)).toBe('50.00')
    expect(result.vesting.unvestedShares.toFixed(2)).toBe('100.00')
    expect(result.errors).toContain(
      'Myytävien osakkeiden määrä ylittää IPO-päivänä myytävissä olevien osakkeiden määrän (50).'
    )
  })

  it('calculates current total value from current share value', () => {
    const result = calculateOsakkeet(createBaseForm())

    expect(result.errors).toEqual([])
    expect(result.ipo.currentShareValue.toFixed(2)).toBe('12.00')
    expect(result.ipo.currentTotalValue.toFixed(2)).toBe('1800.00')
    expect(result.ipo.ipoPricePerShare.toFixed(2)).toBe('10.00')
    expect(result.ipo.increasePercentage.toFixed(2)).toBe('-16.67')
    expect(result.ipo.increaseMultiplier.toFixed(2)).toBe('0.83')
  })

  it('accepts tax rules as a parameter', () => {
    const customRules: OsakkeetTaxRules = {
      ...OSAKKEET_TAX_RULES_2026,
      capitalIncomeTax: {
        threshold: 100,
        lowRate: 0.5,
        highRate: 0.6,
      },
    }

    const result = calculateOsakkeet(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        sell: { amount: '120' },
      }),
      undefined,
      customRules
    )

    expect(result.sell.taxableGainAtLowRate.toFixed(2)).toBe('100.00')
    expect(result.sell.taxableGainAtHighRate.toFixed(2)).toBe('640.00')
    expect(result.sell.estimatedTax.toFixed(2)).toBe('434.00')
  })

  it('matches snapshot for mixed reimbursements dividends vesting and fifo sale', () => {
    expect(
      snapshotCalculation({
        subscriptions: [
          { id: 's1', date: '15.05.2012', vestingEndsOn: '', amount: '120000', totalPrice: '9600' },
          { id: 's2', date: '01.09.2018', vestingEndsOn: '', amount: '30000', totalPrice: '18000' },
          { id: 's3', date: '01.03.2024', vestingEndsOn: '31.12.2026', amount: '10000', totalPrice: '12000' },
        ],
        cashDistributions: [
          { id: 'd1', type: 'capital_return', date: '30.06.2023', amountPerShare: '0.10' },
          { id: 'd2', type: 'capital_return', date: '30.06.2024', amountPerShare: '0.15' },
          { id: 'd3', type: 'dividend', date: '30.06.2025', amountPerShare: '0.20' },
          { id: 'd4', type: 'dividend', date: '15.09.2026', amountPerShare: '0.25' },
        ],
        mathematicalShareValues: [
          { id: 'm1', year: '2023', valuePerShare: '1.10' },
          { id: 'm2', year: '2024', valuePerShare: '1.35' },
          { id: 'm3', year: '2025', valuePerShare: '1.60' },
          { id: 'm4', year: '2026', valuePerShare: '1.90' },
        ],
        ipo: {
          ipoDate: '15.08.2026',
          totalShareCount: '3500000',
          totalIpoCost: '1500000',
          currentShareValue: '42',
          estimatedPreIpoValue: '105000000',
          estimatedSecondaryShareSellPercentage: '7',
        },
        sell: {
          amount: '135000',
        },
      })
    ).toMatchSnapshot()
  })

  it('matches snapshot for high gain across 30k threshold with hmo40 and actual-cost mix', () => {
    expect(
      snapshotCalculation({
        subscriptions: [
          { id: 's1', date: '01.01.2010', vestingEndsOn: '', amount: '100000', totalPrice: '5000' },
          { id: 's2', date: '01.06.2017', vestingEndsOn: '', amount: '50000', totalPrice: '40000' },
          { id: 's3', date: '01.02.2021', vestingEndsOn: '', amount: '40000', totalPrice: '36000' },
        ],
        cashDistributions: [{ id: 'd1', type: 'capital_return', date: '30.06.2024', amountPerShare: '0.18' }],
        mathematicalShareValues: [
          { id: 'm1', year: '2024', valuePerShare: '2.20' },
          { id: 'm2', year: '2025', valuePerShare: '2.40' },
          { id: 'm3', year: '2026', valuePerShare: '2.60' },
        ],
        ipo: {
          ipoDate: '20.09.2026',
          totalShareCount: '500000',
          totalIpoCost: '220000',
          currentShareValue: '95',
          estimatedPreIpoValue: '24000000',
          estimatedSecondaryShareSellPercentage: '38',
        },
        sell: {
          amount: '175000',
        },
      })
    ).toMatchSnapshot()
  })

  it('matches snapshot for validation warnings and missing yearly math values', () => {
    expect(
      snapshotCalculation({
        subscriptions: [
          { id: 's1', date: '01.01.2022', vestingEndsOn: '31.12.2027', amount: '100', totalPrice: '1000' },
          { id: 's2', date: 'not-a-date', vestingEndsOn: '', amount: '-5', totalPrice: 'oops' },
        ],
        cashDistributions: [
          { id: 'd1', type: 'dividend', date: '30.06.2025', amountPerShare: '1.5' },
          { id: 'd2', type: 'capital_return', date: 'bad-date', amountPerShare: '-1' },
        ],
        mathematicalShareValues: [{ id: 'm1', year: '2024', valuePerShare: '1.5' }],
        ipo: {
          ipoDate: '',
          totalShareCount: '80',
          totalIpoCost: '100',
          currentShareValue: '10',
          estimatedPreIpoValue: '2000',
          estimatedSecondaryShareSellPercentage: '0',
        },
        sell: {
          amount: '120',
        },
      })
    ).toMatchSnapshot()
  })
})
