import { describe, expect, it } from 'vitest'
import {
  OSAKKEET_TAX_RULES_2026,
  calculateOsakkeet,
  type OsakkeetTaxRules,
  yearlyTaxCalculator,
} from '../osakkeetUiCalculator'
import { getOsakkeetLocalization } from '../osakkeetLocalizations'
import type { OsakkeetFormData } from '../osakkeetTypes'

const localization = getOsakkeetLocalization('fi')

function calculate(form: OsakkeetFormData, rules?: OsakkeetTaxRules) {
  return calculateOsakkeet(form, localization, rules)
}

function createBaseForm(overrides: Partial<OsakkeetFormData> = {}): OsakkeetFormData {
  return {
    subscriptions: [
      {
        id: 's1',
        date: '01.01.2013',
        vestingEndsOn: '',
        amount: '100',
        pricePerShare: '1',
        otherTotalAcquisitionCosts: '',
      },
      {
        id: 's2',
        date: '01.01.2022',
        vestingEndsOn: '',
        amount: '50',
        pricePerShare: '4',
        otherTotalAcquisitionCosts: '',
      },
    ],
    sells: [],
    cashDistributions: [],
    shareSplits: [],
    demergers: [],
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
    ipoSell: {
      amount: '0',
      otherAnnualCapitalGainsOrLosses: '',
    },
    ...overrides,
  }
}

function decimalValue(value: { toFixed: (precision?: number) => string }) {
  return value.toFixed(2)
}

function snapshotCalculation(form: OsakkeetFormData) {
  const result = calculate(form)
  return {
    warnings: result.warnings,
    errors: result.errors,
    subscriptions: result.subscriptions.map((subscription) => ({
      id: subscription.id,
      date: subscription.date,
      amount: decimalValue(subscription.amount),
      totalPrice: decimalValue(subscription.totalPrice),
      totalPricePerShare: decimalValue(subscription.totalPricePerShare),
      cashDistributionGrossTotal: decimalValue(subscription.cashDistributionGrossTotal),
      capitalRepaymentTotal: decimalValue(subscription.capitalRepaymentTotal),
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
    ipoSell: {
      amount: decimalValue(result.ipoSell.amount),
      otherAnnualCapitalGainsOrLosses: decimalValue(result.ipoSell.otherAnnualCapitalGainsOrLosses),
      usedLots: result.ipoSell.usedLots.map((lot) => ({
        lotId: lot.lotId,
        lotDate: lot.lotDate,
        totalLotShares: decimalValue(lot.totalLotShares),
        soldAmount: decimalValue(lot.soldAmount),
        gross: decimalValue(lot.gross),
        originalCostBasis: decimalValue(lot.originalCostBasis),
        realCostBasis: decimalValue(lot.realCostBasis),
        allocatedSellCost: decimalValue(lot.allocatedSellCost),
        actualDeduction: decimalValue(lot.actualDeduction),
        hankintamenoOlettaRate: decimalValue(lot.hankintamenoOlettaRate),
        hankintamenoOlettaDeduction: decimalValue(lot.hankintamenoOlettaDeduction),
        selectedMethod: lot.selectedMethod,
        selectedDeduction: decimalValue(lot.selectedDeduction),
        taxableGain: decimalValue(lot.taxableGain),
        taxFreeGainPart: decimalValue(lot.taxFreeGainPart),
        taxedGainPart: decimalValue(lot.taxedGainPart),
      })),
      grossTotal: decimalValue(result.ipoSell.grossTotal),
      cashAfterSellCosts: decimalValue(result.ipoSell.cashAfterSellCosts),
      taxFreeAcquisitionRecoveryAfterSellCosts: decimalValue(result.ipoSell.taxFreeAcquisitionRecoveryAfterSellCosts),
      soldShareOriginalCostTotal: decimalValue(result.ipoSell.soldShareOriginalCostTotal),
      soldShareAcquisitionCostTotal: decimalValue(result.ipoSell.soldShareAcquisitionCostTotal),
      selectedActualDeductionTotal: decimalValue(result.ipoSell.selectedActualDeductionTotal),
      selectedHmo20DeductionTotal: decimalValue(result.ipoSell.selectedHmo20DeductionTotal),
      selectedHmo40DeductionTotal: decimalValue(result.ipoSell.selectedHmo40DeductionTotal),
      selectedDeductionTotal: decimalValue(result.ipoSell.selectedDeductionTotal),
      totalAllocatedSellCost: decimalValue(result.ipoSell.totalAllocatedSellCost),
      sellCostDeductedViaActual: decimalValue(result.ipoSell.sellCostDeductedViaActual),
      sellCostPaidWithoutActualDeduction: decimalValue(result.ipoSell.sellCostPaidWithoutActualDeduction),
      taxSavedFromDeductibleSellCosts: decimalValue(result.ipoSell.taxSavedFromDeductibleSellCosts),
      taxableGainTotal: decimalValue(result.ipoSell.taxableGainTotal),
      taxableGainAtLowRate: decimalValue(result.ipoSell.taxableGainAtLowRate),
      taxableGainAtHighRate: decimalValue(result.ipoSell.taxableGainAtHighRate),
      estimatedTax: decimalValue(result.ipoSell.estimatedTax),
      annualNetCapitalGain: decimalValue(result.ipoSell.annualNetCapitalGain),
      annualTaxableGainAtLowRate: decimalValue(result.ipoSell.annualTaxableGainAtLowRate),
      annualTaxableGainAtHighRate: decimalValue(result.ipoSell.annualTaxableGainAtHighRate),
      annualEstimatedTax: decimalValue(result.ipoSell.annualEstimatedTax),
      annualTaxChange: decimalValue(result.ipoSell.annualTaxChange),
      taxReductionFromOtherLosses: decimalValue(result.ipoSell.taxReductionFromOtherLosses),
      netAfterTaxAndSellCost: decimalValue(result.ipoSell.netAfterTaxAndSellCost),
      netAfterAnnualTaxAndSellCost: decimalValue(result.ipoSell.netAfterAnnualTaxAndSellCost),
      netResultAgainstAcquisitionCost: decimalValue(result.ipoSell.netResultAgainstAcquisitionCost),
      remainingUnsoldShares: decimalValue(result.ipoSell.remainingUnsoldShares),
    },
  }
}

describe(calculateOsakkeet, () => {
  it('returns 2016-and-later yearly tax rules from the latest matching rule set', () => {
    expect(yearlyTaxCalculator(2016)).toMatchObject({
      capitalIncomeTax: {
        threshold: 30000,
        lowRate: 0.3,
        highRate: 0.34,
      },
    })
    expect(yearlyTaxCalculator(2026)).toEqual(yearlyTaxCalculator(2016))
    expect(() => yearlyTaxCalculator(2015)).toThrow(/2016 and after/)
  })

  it('warns when yearly tax calculations are used for pre-2016 cash-distribution years', () => {
    const result = calculate(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2015-12-31', amountPerShare: '1' }],
      })
    )

    expect(result.warnings).toContain(
      'Vuositason vero-, osinko- ja pääomanpalautuslaskenta on tuettu verovuosille 2016 ja sitä uudemmille. Syötteissä on vuosi 2015.'
    )
  })

  it('splits cash distributions into capital repayments and dividends lot by lot', () => {
    const result = calculate(
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
    expect(
      result.subscriptions[1].capitalRepaymentBreakdown.map((entry) => ({
        distributionDate: entry.distributionDate,
        shares: entry.shares.toFixed(2),
        capitalRepaymentPerShare: entry.capitalRepaymentPerShare.toFixed(2),
        capitalRepaymentTotal: entry.capitalRepaymentTotal.toFixed(2),
      }))
    ).toEqual([
      {
        distributionDate: '2024-01-01',
        shares: '50.00',
        capitalRepaymentPerShare: '2.00',
        capitalRepaymentTotal: '100.00',
      },
    ])
    expect(result.subscriptions[0].capitalRepaymentPerShare.toFixed(2)).toBe('0.00')
    expect(result.subscriptions[1].capitalRepaymentPerShare.toFixed(2)).toBe('2.00')
    expect(result.subscriptions[1].remainingCostPerShare.toFixed(2)).toBe('2.00')
    expect(
      result.subscriptions[0].capitalRepaymentHoverEntries.map((entry) => ({
        distributionDate: entry.distributionDate,
        applied: entry.appliedCapitalRepaymentTotal.toFixed(2),
        dividend: entry.directedToDividendTotal.toFixed(2),
        reason: entry.dividendReason,
      }))
    ).toEqual([
      {
        distributionDate: '2024-01-01',
        applied: '0.00',
        dividend: '200.00',
        reason: 'too_old',
      },
    ])
    expect(
      result.subscriptions[1].capitalRepaymentHoverEntries.map((entry) => ({
        distributionDate: entry.distributionDate,
        applied: entry.appliedCapitalRepaymentTotal.toFixed(2),
        dividend: entry.directedToDividendTotal.toFixed(2),
        reason: entry.dividendReason,
      }))
    ).toEqual([
      {
        distributionDate: '2024-01-01',
        applied: '100.00',
        dividend: '0.00',
        reason: undefined,
      },
    ])
  })

  it('tracks capital-return rows redirected to dividend when acquisition cost runs out', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '50',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
        ],
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        ipo: {
          ipoDate: '2026-06-01',
          totalShareCount: '50',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '600',
          estimatedSecondaryShareSellPercentage: '20',
        },
      })
    )

    expect(result.subscriptions[0].capitalRepaymentPerShare.toFixed(2)).toBe('1.00')
    expect(result.subscriptions[0].remainingCostPerShare.toFixed(2)).toBe('0.00')
    expect(
      result.subscriptions[0].capitalRepaymentHoverEntries.map((entry) => ({
        appliedPerShare: entry.appliedCapitalRepaymentPerShare.toFixed(2),
        dividendPerShare: entry.directedToDividendPerShare.toFixed(2),
        reason: entry.dividendReason,
      }))
    ).toEqual([
      {
        appliedPerShare: '1.00',
        dividendPerShare: '1.00',
        reason: 'remaining_cost_limit',
      },
    ])
  })

  it('accounts for historical sells in later holdings distributions and IPO sale allocation', () => {
    const result = calculate(
      createBaseForm({
        sells: [{ id: 'sell1', date: '2024-01-01', shareCount: '80', sellPrice: '800', pricePerShare: '10' }],
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-06-01', amountPerShare: '1' }],
        ipoSell: { amount: '70', otherAnnualCapitalGainsOrLosses: '' },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.subscriptions[0].amount.toFixed(2)).toBe('20.00')
    expect(result.subscriptions[1].amount.toFixed(2)).toBe('50.00')
    expect(result.subscriptions[0].shareCalculatorLog).toHaveLength(3)
    expect(result.subscriptions[0].shareCalculatorLog[0].kind).toBe('subscription')
    expect(result.subscriptions[0].shareCalculatorLog[1].kind).toBe('sellForThisSubscription')
    if (result.subscriptions[0].shareCalculatorLog[1].kind === 'sellForThisSubscription') {
      expect(result.subscriptions[0].shareCalculatorLog[1].soldShareCount.toFixed(2)).toBe('80.00')
      expect(result.subscriptions[0].shareCalculatorLog[1].remainingAfter.shareCount.toFixed(2)).toBe('20.00')
    }
    expect(result.subscriptions[0].shareCalculatorLog[2].kind).toBe('capitalRepayment')
    expect(result.cashDistributions[0].sharesHeld.toFixed(2)).toBe('70.00')
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('50.00')
    expect(result.cashDistributions[0].dividendTotal.toFixed(2)).toBe('20.00')
    expect(result.vesting.totalShares.toFixed(2)).toBe('70.00')
    expect(result.ipoSell.usedLots).toHaveLength(2)
    expect(result.ipoSell.usedLots[0].lotId).toBe('s1')
    expect(result.ipoSell.usedLots[0].soldAmount.toFixed(2)).toBe('20.00')
    expect(result.ipoSell.usedLots[1].lotId).toBe('s2')
    expect(result.ipoSell.usedLots[1].soldAmount.toFixed(2)).toBe('50.00')
    expect(result.ipoSell.remainingUnsoldShares.toFixed(2)).toBe('0.00')
  })

  it('applies share splits to later share counts while keeping total acquisition cost unchanged', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '4',
            otherTotalAcquisitionCosts: '',
          },
        ],
        shareSplits: [{ id: 'split1', date: '2024-01-01', multiplier: '2' }],
        demergers: [],
        cashDistributions: [],
        ipo: {
          ipoDate: '2026-06-01',
          totalShareCount: '',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '1200',
          estimatedSecondaryShareSellPercentage: '20',
        },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.subscriptions[0].amount.toFixed(2)).toBe('200.00')
    expect(result.subscriptions[0].totalPrice.toFixed(2)).toBe('400.00')
    expect(result.subscriptions[0].totalPricePerShare.toFixed(2)).toBe('2.00')
    expect(result.subscriptions[0].remainingCostPerShare.toFixed(2)).toBe('2.00')
    expect(result.ipo.totalSubscribedShares.toFixed(2)).toBe('200.00')
    expect(result.vesting.totalShares.toFixed(2)).toBe('200.00')
  })

  it('uses split-adjusted shares for later cash distributions', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '4',
            otherTotalAcquisitionCosts: '',
          },
        ],
        shareSplits: [{ id: 'split1', date: '2024-01-01', multiplier: '2' }],
        demergers: [],
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-06-01', amountPerShare: '1' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.cashDistributions[0].sharesHeld.toFixed(2)).toBe('200.00')
    expect(result.cashDistributions[0].grossTotal.toFixed(2)).toBe('200.00')
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('200.00')
    expect(result.subscriptions[0].capitalRepaymentPerShare.toFixed(2)).toBe('1.00')
    expect(result.subscriptions[0].remainingCostTotal.toFixed(2)).toBe('200.00')
  })

  it('uses split-adjusted shares in ipo sell allocation', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2013',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
        ],
        shareSplits: [{ id: 'split1', date: '2024-01-01', multiplier: '2' }],
        demergers: [],
        ipo: {
          ipoDate: '2026-06-01',
          totalShareCount: '',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '1000',
          estimatedSecondaryShareSellPercentage: '20',
        },
        ipoSell: {
          amount: '150',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.ipoSell.usedLots).toHaveLength(1)
    expect(result.ipoSell.usedLots[0].totalLotShares.toFixed(2)).toBe('200.00')
    expect(result.ipoSell.usedLots[0].soldAmount.toFixed(2)).toBe('150.00')
    expect(result.ipoSell.usedLots[0].originalCostBasis.toFixed(2)).toBe('75.00')
    expect(result.ipoSell.usedLots[0].realCostBasis.toFixed(2)).toBe('75.00')
    expect(result.ipoSell.remainingUnsoldShares.toFixed(2)).toBe('50.00')
  })

  it('allocates acquisition cost to the old company after a demerger', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '10',
            otherTotalAcquisitionCosts: '',
          },
        ],
        demergers: [{ id: 'dmg1', date: '2024-01-01', oldCompanyRatio: '0.72' }],
        cashDistributions: [],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.subscriptions[0].amount.toFixed(2)).toBe('100.00')
    expect(result.subscriptions[0].totalPrice.toFixed(2)).toBe('720.00')
    expect(result.subscriptions[0].totalPricePerShare.toFixed(2)).toBe('7.20')
    expect(result.subscriptions[0].remainingCostTotal.toFixed(2)).toBe('720.00')
    expect(result.subscriptions[0].remainingCostPerShare.toFixed(2)).toBe('7.20')
  })

  it('uses demerger-adjusted acquisition cost for later capital repayments and sale deductions', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '10',
            otherTotalAcquisitionCosts: '',
          },
        ],
        demergers: [{ id: 'dmg1', date: '2024-01-01', oldCompanyRatio: '0.72' }],
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-06-01', amountPerShare: '8' }],
        ipo: {
          ipoDate: '2026-06-01',
          totalShareCount: '',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '1000',
          estimatedSecondaryShareSellPercentage: '20',
        },
        ipoSell: {
          amount: '100',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.cashDistributions[0].grossTotal.toFixed(2)).toBe('800.00')
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('720.00')
    expect(result.cashDistributions[0].dividendTotal.toFixed(2)).toBe('80.00')
    expect(result.subscriptions[0].remainingCostTotal.toFixed(2)).toBe('0.00')
    expect(result.ipoSell.usedLots[0].originalCostBasis.toFixed(2)).toBe('720.00')
    expect(result.ipoSell.usedLots[0].realCostBasis.toFixed(2)).toBe('0.00')
  })

  it('does not apply a demerger to subscriptions acquired after the demerger date', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '10',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's2',
            date: '01.06.2024',
            vestingEndsOn: '',
            amount: '50',
            pricePerShare: '8',
            otherTotalAcquisitionCosts: '',
          },
        ],
        demergers: [{ id: 'dmg1', date: '2024-01-01', oldCompanyRatio: '0.72' }],
        cashDistributions: [],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.subscriptions[0].totalPrice.toFixed(2)).toBe('720.00')
    expect(result.subscriptions[1].totalPrice.toFixed(2)).toBe('400.00')
    expect(result.subscriptions[0].totalPricePerShare.toFixed(2)).toBe('7.20')
    expect(result.subscriptions[1].totalPricePerShare.toFixed(2)).toBe('8.00')
  })

  it('allows share-count and acquisition-cost changes on the same day', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '10',
            otherTotalAcquisitionCosts: '',
          },
        ],
        shareSplits: [{ id: 'split1', date: '2024-01-01', multiplier: '2' }],
        demergers: [{ id: 'dmg1', date: '2024-01-01', oldCompanyRatio: '0.72' }],
        cashDistributions: [],
      })
    )

    expect(result.errors.some((error) => error.includes('Timestamp conflict'))).toBe(false)
  })

  it('rejects demerger ratios above one', () => {
    const result = calculate(
      createBaseForm({
        demergers: [{ id: 'dmg1', date: '2024-01-01', oldCompanyRatio: '1.2' }],
      })
    )

    expect(result.errors).not.toEqual([])
    expect(result.errors.some((error) => error.includes('dmg1'))).toBe(true)
  })

  it('treats cash distributions on or after ipo date as dividends', () => {
    const result = calculate(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'dividend', date: '2026-06-01', amountPerShare: '1' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.cashDistributions[0].treatedAsListedDividend).toBe(true)
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('0.00')
    expect(result.cashDistributions[0].dividendTotal.toFixed(2)).toBe('150.00')
  })

  it('treats post-IPO capital-return rows as listed dividends in yearly tax calculations', () => {
    const result = calculate(
      createBaseForm({
        mathematicalShareValues: [],
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2026-06-15', amountPerShare: '1' }],
      })
    )

    expect(result.errors).toEqual([])
    expect(result.cashDistributions[0].type).toBe('dividend')
    expect(result.cashDistributions[0].treatedAsListedDividend).toBe(true)
    expect(result.cashDistributions[0].capitalRepaymentTotal.toFixed(2)).toBe('0.00')
    expect(result.cashDistributions[0].dividendTotal.toFixed(2)).toBe('150.00')
    expect(result.cashDistributions[0].taxableCapitalIncome.toFixed(2)).toBe('127.50')
    expect(result.cashDistributions[0].taxFreeCapitalIncomePortion.toFixed(2)).toBe('22.50')
    expect(result.cashDistributions[0].taxableEarnedDividend.toFixed(2)).toBe('0.00')
    expect(result.cashDistributions[0].taxFreeEarnedDividend.toFixed(2)).toBe('0.00')
    expect(result.cashDistributions[0].withholdingToTaxOffice.toFixed(2)).toBe('38.25')
  })

  it('builds tax-return asset and capital-gain summaries as tables can consume them', () => {
    const result = calculate(
      createBaseForm({
        ipoSell: { amount: '120', otherAnnualCapitalGainsOrLosses: '' },
      })
    )

    const year2024 = result.taxReturns.years.find((year) => year.year === 2024)
    const year2025 = result.taxReturns.years.find((year) => year.year === 2025)
    const year2026 = result.taxReturns.years.find((year) => year.year === 2026)

    expect(year2024?.assets?.date).toBe('31.12.2024')
    expect(year2024?.assets?.shareCount.toFixed(2)).toBe('150.00')
    expect(year2024?.assets?.shareholderMathematicalValue.toFixed(2)).toBe('3000.00')
    expect(year2024?.assets?.remainingAcquisitionCost.toFixed(2)).toBe('300.00')
    expect(year2025?.assets?.date).toBe('31.12.2025')
    expect(year2025?.assets?.shareholderMathematicalValue.toFixed(2)).toBe('3000.00')
    expect(year2026?.assets).toBeUndefined()
    expect(year2026?.ipoSale?.entries).toHaveLength(2)
    expect(year2026?.ipoSale?.entries[0].subscriptionDate).toBe('01.01.2013')
    expect(year2026?.ipoSale?.entries[0].sellDate).toBe('2026-06-01')
    expect(year2026?.ipoSale?.soldShareCount.toFixed(2)).toBe('120.00')
    expect(year2026?.ipoSale?.grossSale.toFixed(2)).toBe('1200.00')
    expect(year2026?.ipoSale?.selectedDeductionTotal.toFixed(2)).toBe('500.00')
    expect(year2026?.ipoSale?.taxableCapitalGain.toFixed(2)).toBe('700.00')
  })

  it('uses fifo lots and picks the more beneficial deduction method per lot', () => {
    const result = calculate(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        ipoSell: { amount: '120' },
      })
    )

    expect(result.errors).toEqual([])
    expect(result.ipoSell.usedLots).toHaveLength(2)
    expect(result.ipoSell.usedLots[0].lotId).toBe('s1')
    expect(result.ipoSell.usedLots[0].selectedMethod).toBe('hmo')
    expect(result.ipoSell.usedLots[1].lotId).toBe('s2')
    expect(result.ipoSell.usedLots[1].selectedMethod).toBe('actual_costs')
    expect(result.ipoSell.grossTotal.toFixed(2)).toBe('1200.00')
    expect(result.ipoSell.totalAllocatedSellCost.toFixed(2)).toBe('120.00')
    expect(result.ipoSell.taxableGainTotal.toFixed(2)).toBe('740.00')
    expect(result.ipoSell.estimatedTax.toFixed(2)).toBe('222.00')
    expect(result.ipoSell.netAfterTaxAndSellCost.toFixed(2)).toBe('858.00')
  })

  it('includes price per share and other acquisition costs in the actual cost basis', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2013',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '50',
          },
        ],
        ipo: {
          ipoDate: '2026-06-01',
          totalShareCount: '100',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '200',
          estimatedSecondaryShareSellPercentage: '100',
        },
        ipoSell: { amount: '100' },
      })
    )

    expect(result.subscriptions[0].totalPrice.toFixed(2)).toBe('150.00')
    expect(result.subscriptions[0].totalPricePerShare.toFixed(2)).toBe('1.50')
    expect(result.ipoSell.usedLots[0].realCostBasis.toFixed(2)).toBe('150.00')
    expect(result.ipoSell.usedLots[0].selectedMethod).toBe('actual_costs')
  })

  it('excludes vesting-restricted lots from the IPO sale allocation', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2013',
            vestingEndsOn: '31.12.2026',
            amount: '100',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's2',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '50',
            pricePerShare: '4',
            otherTotalAcquisitionCosts: '',
          },
        ],
        ipoSell: { amount: '60' },
      })
    )

    expect(result.ipoSell.usedLots).toHaveLength(1)
    expect(result.ipoSell.usedLots[0].lotId).toBe('s2')
    expect(result.ipoSell.usedLots[0].soldAmount.toFixed(2)).toBe('50.00')
    expect(result.vesting.totalShares.toFixed(2)).toBe('150.00')
    expect(result.vesting.vestedShares.toFixed(2)).toBe('50.00')
    expect(result.vesting.unvestedShares.toFixed(2)).toBe('100.00')
    expect(result.errors).toContain(
      'Myytävien osakkeiden määrä ylittää IPO-päivänä myytävissä olevien osakkeiden määrän (50).'
    )
  })

  it('excludes subscriptions made after the IPO date from IPO sell calculations', () => {
    const result = calculate(
      createBaseForm({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2013',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's2',
            date: '01.07.2026',
            vestingEndsOn: '',
            amount: '50',
            pricePerShare: '4',
            otherTotalAcquisitionCosts: '',
          },
        ],
        ipo: {
          ipoDate: '2026-06-01',
          totalShareCount: '150',
          totalIpoCost: '30',
          currentShareValue: '12',
          estimatedPreIpoValue: '1500',
          estimatedSecondaryShareSellPercentage: '80',
        },
        ipoSell: { amount: '120' },
      })
    )

    expect(result.ipoSell.usedLots).toHaveLength(1)
    expect(result.ipoSell.usedLots[0].lotId).toBe('s1')
    expect(result.vesting.totalShares.toFixed(2)).toBe('100.00')
    expect(result.errors).toContain(
      'Myytävien osakkeiden määrä ylittää IPO-päivänä myytävissä olevien osakkeiden määrän (100).'
    )
  })

  it('calculates current total value from current share value', () => {
    const result = calculate(createBaseForm())

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

    const result = calculate(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        ipoSell: { amount: '120' },
      }),
      customRules
    )

    expect(result.ipoSell.taxableGainAtLowRate.toFixed(2)).toBe('100.00')
    expect(result.ipoSell.taxableGainAtHighRate.toFixed(2)).toBe('640.00')
    expect(result.ipoSell.estimatedTax.toFixed(2)).toBe('434.00')
  })

  it('reduces annual tax estimate when other annual capital losses are entered', () => {
    const result = calculate(
      createBaseForm({
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        ipoSell: { amount: '120', otherAnnualCapitalGainsOrLosses: '-200' },
      })
    )

    expect(result.ipoSell.taxableGainTotal.toFixed(2)).toBe('740.00')
    expect(result.ipoSell.annualNetCapitalGain.toFixed(2)).toBe('540.00')
    expect(result.ipoSell.estimatedTax.toFixed(2)).toBe('222.00')
    expect(result.ipoSell.annualEstimatedTax.toFixed(2)).toBe('162.00')
    expect(result.ipoSell.taxReductionFromOtherLosses.toFixed(2)).toBe('60.00')
  })

  it('matches snapshot for mixed reimbursements dividends vesting and fifo sale', () => {
    expect(
      snapshotCalculation({
        subscriptions: [
          {
            id: 's1',
            date: '15.05.2012',
            vestingEndsOn: '',
            amount: '120000',
            pricePerShare: '0.08',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's2',
            date: '01.09.2018',
            vestingEndsOn: '',
            amount: '30000',
            pricePerShare: '0.6',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's3',
            date: '01.03.2024',
            vestingEndsOn: '31.12.2026',
            amount: '10000',
            pricePerShare: '1.2',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        shareSplits: [],
        demergers: [],
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
        ipoSell: {
          amount: '135000',
        },
      })
    ).toMatchSnapshot()
  })

  it('matches snapshot for high gain across 30k threshold with hmo40 and actual-cost mix', () => {
    expect(
      snapshotCalculation({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2010',
            vestingEndsOn: '',
            amount: '100000',
            pricePerShare: '0.05',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's2',
            date: '01.06.2017',
            vestingEndsOn: '',
            amount: '50000',
            pricePerShare: '0.8',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's3',
            date: '01.02.2021',
            vestingEndsOn: '',
            amount: '40000',
            pricePerShare: '0.9',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        shareSplits: [],
        demergers: [],
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
        ipoSell: {
          amount: '175000',
        },
      })
    ).toMatchSnapshot()
  })

  it('matches snapshot for validation warnings and missing yearly math values', () => {
    expect(
      snapshotCalculation({
        subscriptions: [
          {
            id: 's1',
            date: '01.01.2022',
            vestingEndsOn: '31.12.2027',
            amount: '100',
            pricePerShare: '10',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 's2',
            date: 'not-a-date',
            vestingEndsOn: '',
            amount: '-5',
            pricePerShare: 'oops',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        shareSplits: [],
        demergers: [],
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
        ipoSell: {
          amount: '120',
        },
      })
    ).toMatchSnapshot()
  })
})
