import Decimal from 'decimal.js'
import { type OsakkeetLocalization } from './osakkeetLocalizations'
import {
  parseEventTimestamp,
  parseOsakkeetCalculatorInputs,
  type ParsedCapitalRepaymentOrDividend,
  type ParsedIpoInputs,
  type ParsedSellInputs,
  type ParsedSubscription,
} from './osakkeetParsedData'
import type { OsakkeetFormData } from './osakkeetTypes'
import {
  createShareCalculator,
  type ShareCalculator,
  type ShareCalculatorError,
  type ShareCalculatorLogEntry,
} from './shareCalculator'
import { compareDateStrings, isAtLeastYears, isWithinYearsInclusive, sumDecimals } from './osakkeetUtils'

type WorkingLot = ParsedSubscription & {
  originalShareCount: Decimal
  originalShareAcquisitionCost: Decimal
  baseShareAcquisitionCost: Decimal
  capitalRepaymentTotal: Decimal
  cashDistributionGrossTotal: Decimal
  capitalRepaymentBreakdown: CapitalRepaymentBreakdown[]
  capitalRepaymentHoverEntries: CapitalRepaymentHoverEntry[]
  shareCalculatorLog: ShareCalculatorLogEntry[]
  acquisitionCostAdjustments: AcquisitionCostAdjustment[]
}

type CapitalRepaymentBreakdown = {
  distributionDate: string
  shares: Decimal
  capitalRepaymentPerShare: Decimal
  capitalRepaymentTotal: Decimal
}

type CapitalRepaymentHoverEntry = {
  distributionDate: string
  shares: Decimal
  inputAmountPerShare: Decimal
  appliedCapitalRepaymentPerShare: Decimal
  appliedCapitalRepaymentTotal: Decimal
  directedToDividendPerShare: Decimal
  directedToDividendTotal: Decimal
  dividendReason?: 'too_old' | 'no_remaining_cost' | 'listed_dividend' | 'remaining_cost_limit'
}

type AcquisitionCostAdjustment =
  | {
      kind: 'split'
      date: string
      beforeShares: Decimal
      afterShares: Decimal
      multiplier: Decimal
    }
  | {
      kind: 'demerger'
      date: string
      beforeTotalPrice: Decimal
      afterTotalPrice: Decimal
      oldCompanyRatio: Decimal
    }

type AcquisitionCostExplanation = {
  originalAmount: Decimal
  originalPricePerShare: Decimal
  originalOtherTotalAcquisitionCosts: Decimal
  originalTotalPrice: Decimal
  adjustments: AcquisitionCostAdjustment[]
}

type SubscriptionSummary = {
  id: string
  date: string
  amount: Decimal
  acquisitionCostExplanation: AcquisitionCostExplanation
  totalPrice: Decimal
  totalPricePerShare: Decimal
  cashDistributionGrossTotal: Decimal
  capitalRepaymentTotal: Decimal
  capitalRepaymentBreakdown: CapitalRepaymentBreakdown[]
  capitalRepaymentHoverEntries: CapitalRepaymentHoverEntry[]
  shareCalculatorLog: ShareCalculatorLogEntry[]
  capitalRepaymentPerShare: Decimal
  remainingCostPerShare: Decimal
  remainingCostTotal: Decimal
}

type CashDistributionAllocation = {
  subscriptionId: string
  subscriptionDate: string
  shares: Decimal
  gross: Decimal
  capitalRepayment: Decimal
  dividend: Decimal
  remainingCostPerShareAfter: Decimal
  eligibleCapitalRepayment: boolean
}

type CashDistributionSummary = {
  id: string
  date: string
  type: 'capital_return' | 'dividend'
  amountPerShare: Decimal
  sharesHeld: Decimal
  capitalRepaymentShareCount: Decimal
  dividendShareCount: Decimal
  mathematicalShareValuePerShare: Decimal
  shareholderMathematicalValue: Decimal
  eightPercentYieldLimit: Decimal
  expectedTotal: Decimal
  grossTotal: Decimal
  paidInCash: Decimal
  capitalRepaymentTotal: Decimal
  dividendTotal: Decimal
  withholdingToTaxOffice: Decimal
  taxableCapitalIncome: Decimal
  taxFreeCapitalIncomePortion: Decimal
  taxableEarnedDividend: Decimal
  taxFreeEarnedDividend: Decimal
  treatedAsListedDividend: boolean
  allocations: CashDistributionAllocation[]
}

type SellLotSummary = {
  subscriptionId: string
  subscriptionDate: string
  totalSubscriptionShares: Decimal
  soldAmount: Decimal
  gross: Decimal
  originalCostBasis: Decimal
  realCostBasis: Decimal
  allocatedIpoCost: Decimal
  actualDeduction: Decimal
  hankintamenoOlettaRate: Decimal
  hankintamenoOlettaDeduction: Decimal
  selectedMethod: 'actual_costs' | 'hmo'
  selectedDeduction: Decimal
  taxableGain: Decimal
  taxFreeGainPart: Decimal
  taxedGainPart: Decimal
}

type TaxReturnTotals = {
  paidInCash: Decimal
  withholdingToTaxOffice: Decimal
  capitalRepaymentTotal: Decimal
  dividendTotal: Decimal
  taxableCapitalIncome: Decimal
  taxFreeCapitalIncome: Decimal
  taxableEarnedDividend: Decimal
  taxFreeEarnedDividend: Decimal
}

type TaxReturnSectionSummary = {
  mode: 'unlisted' | 'listed'
  entries: CashDistributionSummary[]
  totals: TaxReturnTotals
}

type TaxReturnAssetSummary = {
  date: string
  shareCount: Decimal
  mathematicalShareValuePerShare: Decimal
  shareholderMathematicalValue: Decimal
  remainingAcquisitionCost: Decimal
}

type TaxReturnIpoSaleEntry = {
  subscriptionDate: string
  sellDate: string
  soldShareCount: Decimal
  grossSale: Decimal
  actualDeduction: Decimal
  hankintamenoOlettaDeduction: Decimal
  selectedMethod: 'actual_costs' | 'hmo'
  selectedDeduction: Decimal
  taxableCapitalGain: Decimal
}

type TaxReturnIpoSaleSummary = {
  entries: TaxReturnIpoSaleEntry[]
  soldShareCount: Decimal
  grossSale: Decimal
  actualDeductionTotal: Decimal
  hankintamenoOlettaDeductionTotal: Decimal
  selectedDeductionTotal: Decimal
  totalIpoCostAllocated: Decimal
  taxableCapitalGain: Decimal
  estimatedTax: Decimal
  netCash: Decimal
}

type TaxReturnYearSummary = {
  year: number
  missingMathematicalValueWarningDates: string[]
  assets?: TaxReturnAssetSummary
  unlisted?: TaxReturnSectionSummary
  listed?: TaxReturnSectionSummary
  ipoSale?: TaxReturnIpoSaleSummary
}

export type OsakkeetCalculation = {
  formData: OsakkeetFormData
  warnings: string[]
  errors: string[]
  subscriptions: SubscriptionSummary[]
  cashDistributions: CashDistributionSummary[]
  vesting: {
    totalShares: Decimal
    vestedShares: Decimal
    unvestedShares: Decimal
  }
  currentVesting: {
    totalShares: Decimal
    vestedShares: Decimal
    unvestedShares: Decimal
  }
  ipo: {
    ipoDate?: Date
    totalShareCount: Decimal
    totalSubscribedShares: Decimal
    totalSubscribedCost: Decimal
    totalIpoCost: Decimal
    currentShareValue: Decimal
    currentTotalValue: Decimal
    estimatedPreIpoValue: Decimal
    estimatedSecondaryShareSellPercentage: Decimal
    estimatedSecondaryShareCount: Decimal
    ipoPricePerShare: Decimal
    currentValuePerShare: Decimal
    increasePercentage: Decimal
    increaseMultiplier: Decimal
    ipoCostPerShare: Decimal
  }
  sell: {
    amount: Decimal
    otherAnnualCapitalGainsOrLosses: Decimal
    usedSubscriptions: SellLotSummary[]
    grossTotal: Decimal
    cashAfterIpoCosts: Decimal
    taxFreeAcquisitionRecoveryAfterIpoCosts: Decimal
    soldShareOriginalCostTotal: Decimal
    soldShareAcquisitionCostTotal: Decimal
    selectedActualDeductionTotal: Decimal
    selectedHmo20DeductionTotal: Decimal
    selectedHmo40DeductionTotal: Decimal
    selectedDeductionTotal: Decimal
    totalIpoCostAllocated: Decimal
    ipoCostDeductedViaActual: Decimal
    ipoCostPaidWithoutActualDeduction: Decimal
    taxSavedFromDeductibleIpoCosts: Decimal
    taxableGainTotal: Decimal
    taxableGainAtLowRate: Decimal
    taxableGainAtHighRate: Decimal
    estimatedTax: Decimal
    annualNetCapitalGain: Decimal
    annualTaxableGainAtLowRate: Decimal
    annualTaxableGainAtHighRate: Decimal
    annualEstimatedTax: Decimal
    annualTaxChange: Decimal
    taxReductionFromOtherLosses: Decimal
    netAfterTaxAndIpoCost: Decimal
    netAfterAnnualTaxAndIpoCost: Decimal
    selectedHmoDeductionTotal: Decimal
    netResultAgainstSubscriptionCost: Decimal
    remainingUnsoldShares: Decimal
  }
  taxReturns: {
    years: TaxReturnYearSummary[]
  }
}

const zero = new Decimal(0)

export type OsakkeetTaxRules = {
  capitalIncomeTax: {
    threshold: number
    lowRate: number
    highRate: number
  }
  capitalRepayment: {
    eligibilityYears: number
  }
  hankintamenoOlettama: {
    ownershipYearsThreshold: number
    shortOwnershipRate: number
    longOwnershipRate: number
  }
  unlistedDividend: {
    mathematicalValueYieldRate: number
    annualCapitalDividendThreshold: number
    lowCapitalDividendTaxableRate: number
    highCapitalDividendTaxableRate: number
    lowCapitalDividendTaxFreeRate: number
    highCapitalDividendTaxFreeRate: number
    earnedDividendTaxableRate: number
    earnedDividendTaxFreeRate: number
    withholdingThreshold: number
    lowWithholdingRate: number
    highWithholdingRate: number
  }
  listedDividend: {
    taxableCapitalIncomeRate: number
    taxFreeCapitalIncomeRate: number
    withholdingRate: number
  }
}

type YearlyTaxRules = OsakkeetTaxRules & {
  year: number
}

const OSAKKEET_TAX_RULES_2016: YearlyTaxRules = {
  year: 2016,
  capitalIncomeTax: {
    threshold: 30000,
    lowRate: 0.3,
    highRate: 0.34,
  },
  capitalRepayment: {
    eligibilityYears: 10,
  },
  hankintamenoOlettama: {
    ownershipYearsThreshold: 10,
    shortOwnershipRate: 0.2,
    longOwnershipRate: 0.4,
  },
  unlistedDividend: {
    mathematicalValueYieldRate: 0.08,
    annualCapitalDividendThreshold: 150000,
    lowCapitalDividendTaxableRate: 0.25,
    highCapitalDividendTaxableRate: 0.85,
    lowCapitalDividendTaxFreeRate: 0.75,
    highCapitalDividendTaxFreeRate: 0.15,
    earnedDividendTaxableRate: 0.75,
    earnedDividendTaxFreeRate: 0.25,
    withholdingThreshold: 150000,
    lowWithholdingRate: 0.075,
    highWithholdingRate: 0.28,
  },
  listedDividend: {
    taxableCapitalIncomeRate: 0.85,
    taxFreeCapitalIncomeRate: 0.15,
    withholdingRate: 0.255,
  },
}

const YEARLY_TAX_RULES: YearlyTaxRules[] = [OSAKKEET_TAX_RULES_2016]

export function yearlyTaxCalculator(year: number): OsakkeetTaxRules {
  if (year < OSAKKEET_TAX_RULES_2016.year) {
    throw new Error(`yearlyTaxCalculator supports years ${OSAKKEET_TAX_RULES_2016.year} and after, got ${year}`)
  }

  let activeRules = YEARLY_TAX_RULES[0]
  for (const rules of YEARLY_TAX_RULES) {
    if (rules.year > year) break
    activeRules = rules
  }
  return activeRules
}

export const OSAKKEET_TAX_RULES_2026: OsakkeetTaxRules = yearlyTaxCalculator(2026)

function createLot(input: ParsedSubscription) {
  return {
    ...input,
    originalShareCount: input.shareCount,
    originalShareAcquisitionCost: input.shareAcquisitionCost,
    baseShareAcquisitionCost: input.shareAcquisitionCost,
    capitalRepaymentTotal: zero,
    cashDistributionGrossTotal: zero,
    capitalRepaymentBreakdown: [],
    capitalRepaymentHoverEntries: [],
    shareCalculatorLog: [],
    acquisitionCostAdjustments: [],
  } satisfies WorkingLot
}

function estimateCapitalTax(taxableGain: Decimal, rules: OsakkeetTaxRules) {
  if (taxableGain.lte(0)) return zero
  const threshold = new Decimal(rules.capitalIncomeTax.threshold)
  const lowPart = Decimal.min(taxableGain, threshold)
  const highPart = Decimal.max(taxableGain.minus(threshold), zero)
  return lowPart.mul(rules.capitalIncomeTax.lowRate).add(highPart.mul(rules.capitalIncomeTax.highRate))
}

function resolveYearlyTaxRules(year: number | undefined, fallbackRules: OsakkeetTaxRules, useYearlyRules: boolean) {
  if (!useYearlyRules || year == null || year < OSAKKEET_TAX_RULES_2016.year) {
    return fallbackRules
  }
  return yearlyTaxCalculator(year)
}

function collectUnsupportedYearWarnings(
  cashDistributions: ParsedCapitalRepaymentOrDividend[],
  ipoDate: Date | undefined,
  sellAmount: Decimal,
  warnings: string[],
  localization: OsakkeetLocalization,
  useYearlyRules: boolean
) {
  if (!useYearlyRules) return

  const unsupportedYears = new Set<number>()
  cashDistributions.forEach((entry) => {
    const year = entry.dateValue?.getUTCFullYear()
    if (year != null && year < OSAKKEET_TAX_RULES_2016.year) {
      unsupportedYears.add(year)
    }
  })
  const ipoYear = ipoDate?.getUTCFullYear()
  if (ipoYear != null && ipoYear < OSAKKEET_TAX_RULES_2016.year && sellAmount.gt(0)) {
    unsupportedYears.add(ipoYear)
  }
  ;[...unsupportedYears]
    .sort((a, b) => a - b)
    .forEach((year) => warnings.push(localization.calculator.warnings.unsupportedYearRange(year)))
}

type IpoSummary = OsakkeetCalculation['ipo']
type SellSummary = OsakkeetCalculation['sell']
type VestingSummary = OsakkeetCalculation['vesting'] & {
  sellableLots: WorkingLot[]
  lockedLots: WorkingLot[]
}

function mapShareCalculatorErrors(shareCalculatorErrors: ShareCalculatorError[], errors: string[]) {
  shareCalculatorErrors.forEach((error) => {
    if (!errors.includes(error.message)) {
      errors.push(error.message)
    }
  })
}

function getLatestLotStateOrZero(shareCalculator: ShareCalculator, subscriptionId: string) {
  const result = shareCalculator.getRemainingCountAndAcquisitionCost(
    subscriptionId,
    new Date('9999-12-31T23:59:59.999Z')
  )
  const subscriptionEntry = result.log.find((entry) => entry.kind === 'subscription')
  const baseShareAcquisitionCost = result.log
    .filter(
      (entry) =>
        entry.kind === 'subscription' ||
        entry.kind === 'companyAcquisitionCostChange' ||
        entry.kind === 'sellForThisSubscription'
    )
    .reduce(
      (acc, entry) => {
        if (entry.kind === 'subscription') return entry.shareAcquisitionCost
        if (entry.kind === 'companyAcquisitionCostChange') return acc.mul(entry.shareAcquisitionCostMultiplier)
        if (entry.kind === 'sellForThisSubscription')
          return Decimal.max(acc.minus(entry.soldBaseShareAcquisitionCost), zero)
        return acc
      },
      subscriptionEntry?.kind === 'subscription' ? subscriptionEntry.shareAcquisitionCost : zero
    )

  return {
    shareCount: result.remaining.shareCount,
    shareAcquisitionCost: result.remaining.shareAcquisitionCost,
    baseShareAcquisitionCost,
  }
}

function getLotStateAtOrZero(
  shareCalculator: ShareCalculator,
  subscriptionId: string,
  timestamp: Date,
  inclusive = true
) {
  const effectiveTimestamp = inclusive ? timestamp : new Date(timestamp.getTime() - 1)
  const result = shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, effectiveTimestamp)
  const subscriptionEntry = result.log.find((entry) => entry.kind === 'subscription')
  const baseShareAcquisitionCost = result.log
    .filter(
      (entry) =>
        entry.kind === 'subscription' ||
        entry.kind === 'companyAcquisitionCostChange' ||
        entry.kind === 'sellForThisSubscription'
    )
    .reduce(
      (acc, entry) => {
        if (entry.kind === 'subscription') return entry.shareAcquisitionCost
        if (entry.kind === 'companyAcquisitionCostChange') return acc.mul(entry.shareAcquisitionCostMultiplier)
        if (entry.kind === 'sellForThisSubscription')
          return Decimal.max(acc.minus(entry.soldBaseShareAcquisitionCost), zero)
        return acc
      },
      subscriptionEntry?.kind === 'subscription' ? subscriptionEntry.shareAcquisitionCost : zero
    )

  return {
    shareCount: result.remaining.shareCount,
    shareAcquisitionCost: result.remaining.shareAcquisitionCost,
    baseShareAcquisitionCost,
  }
}

function buildAcquisitionCostAdjustments(
  lot: WorkingLot,
  shareCalculator: ShareCalculator
): AcquisitionCostAdjustment[] {
  const adjustments: AcquisitionCostAdjustment[] = []
  let baseShareAcquisitionCost = lot.originalShareAcquisitionCost
  const log = shareCalculator.getRemainingCountAndAcquisitionCost(lot.id, new Date('9999-12-31T23:59:59.999Z')).log
  for (const entry of log) {
    if (entry.kind === 'companyShareCountChange') {
      const beforeShares = entry.remainingAfter.shareCount.div(entry.shareCountMultiplier)
      adjustments.push({
        kind: 'split',
        date: entry.date,
        beforeShares,
        afterShares: entry.remainingAfter.shareCount,
        multiplier: entry.shareCountMultiplier,
      })
      continue
    }

    if (entry.kind === 'companyAcquisitionCostChange') {
      const beforeTotalPrice = baseShareAcquisitionCost
      baseShareAcquisitionCost = baseShareAcquisitionCost.mul(entry.shareAcquisitionCostMultiplier)
      adjustments.push({
        kind: 'demerger',
        date: entry.date,
        beforeTotalPrice,
        afterTotalPrice: baseShareAcquisitionCost,
        oldCompanyRatio: entry.shareAcquisitionCostMultiplier,
      })
    }
  }

  return adjustments
}

function buildShareCalculatorLog(subscriptionId: string, shareCalculator: ShareCalculator) {
  return shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, new Date('9999-12-31T23:59:59.999Z')).log
}

function buildFinalLotsFromShareCalculator(baseLots: WorkingLot[], shareCalculator: ShareCalculator) {
  return baseLots.map((lot) => {
    const latestState = getLatestLotStateOrZero(shareCalculator, lot.id)
    return {
      ...lot,
      shareCount: latestState.shareCount,
      baseShareAcquisitionCost: latestState.baseShareAcquisitionCost,
      shareAcquisitionCost: latestState.shareAcquisitionCost,
      capitalRepaymentTotal: zero,
      shareCalculatorLog: buildShareCalculatorLog(lot.id, shareCalculator),
      acquisitionCostAdjustments: buildAcquisitionCostAdjustments(lot, shareCalculator),
    }
  })
}

function parseIpoAndSellInputs(
  ipoInput: ParsedIpoInputs,
  sellInput: ParsedSellInputs,
  ipoDate: Date | undefined,
  totalSubscribedShares: Decimal,
  totalSubscribedCost: Decimal,
  warnings: string[],
  localization: OsakkeetLocalization
) {
  const totalShareCountInput = ipoInput.totalShareCountInput
  const totalShareCount = totalShareCountInput.gt(0) ? totalShareCountInput : totalSubscribedShares
  const totalIpoCost = ipoInput.totalIpoCost
  const currentShareValue = ipoInput.currentShareValue
  const currentTotalValue = currentShareValue.mul(totalShareCount)
  const estimatedPreIpoValue = ipoInput.estimatedPreIpoValue
  const estimatedSecondaryShareSellPercentage = ipoInput.estimatedSecondaryShareSellPercentage
  const sellAmount = sellInput.amount
  const otherAnnualCapitalGainsOrLosses = sellInput.otherAnnualCapitalGainsOrLosses

  if (totalShareCountInput.gt(0) && totalShareCountInput.lt(totalSubscribedShares)) {
    warnings.push(localization.calculator.warnings.totalShareCountBelowSubscriptions)
  }

  const estimatedSecondaryShareCount = totalShareCount.mul(estimatedSecondaryShareSellPercentage).div(100)
  const ipoPricePerShare = totalShareCount.gt(0) ? estimatedPreIpoValue.div(totalShareCount) : zero
  const currentValuePerShare = totalShareCount.gt(0) ? currentTotalValue.div(totalShareCount) : zero
  const increaseMultiplier = currentValuePerShare.gt(0) ? ipoPricePerShare.div(currentValuePerShare) : zero
  const increasePercentage = currentValuePerShare.gt(0)
    ? ipoPricePerShare.div(currentValuePerShare).minus(1).mul(100)
    : zero
  const ipoCostPerShare = estimatedSecondaryShareCount.gt(0)
    ? totalIpoCost.div(estimatedSecondaryShareCount)
    : totalShareCount.gt(0)
      ? totalIpoCost.div(totalShareCount)
      : zero

  if (estimatedSecondaryShareCount.eq(0) && totalIpoCost.gt(0)) {
    warnings.push(localization.calculator.warnings.secondarySellPercentZero)
  }

  return {
    ipoDate,
    sellAmount,
    otherAnnualCapitalGainsOrLosses,
    ipo: {
      ipoDate,
      totalShareCount,
      totalSubscribedShares,
      totalSubscribedCost,
      totalIpoCost,
      currentShareValue,
      currentTotalValue,
      estimatedPreIpoValue,
      estimatedSecondaryShareSellPercentage,
      estimatedSecondaryShareCount,
      ipoPricePerShare,
      currentValuePerShare,
      increasePercentage,
      increaseMultiplier,
      ipoCostPerShare,
    } satisfies IpoSummary,
  }
}

function calculateVestingSummary(lots: WorkingLot[], ipoDate?: Date): VestingSummary {
  const ipoEligibleLots = lots.filter(
    (lot) => !lot.dateValue || !ipoDate || lot.dateValue.getTime() <= ipoDate.getTime()
  )
  const sellableLots = ipoEligibleLots.filter(
    (lot) =>
      lot.shareCount.gt(0) &&
      (!lot.vestingEndsOnValue || !!(ipoDate && ipoDate.getTime() >= lot.vestingEndsOnValue.getTime()))
  )
  const lockedLots = ipoEligibleLots.filter(
    (lot) =>
      lot.shareCount.gt(0) &&
      !!lot.vestingEndsOnValue &&
      (!ipoDate || ipoDate.getTime() < lot.vestingEndsOnValue.getTime())
  )
  return {
    sellableLots,
    lockedLots,
    totalShares: sumDecimals(ipoEligibleLots.map((lot) => lot.shareCount)),
    vestedShares: sumDecimals(sellableLots.map((lot) => lot.shareCount)),
    unvestedShares: sumDecimals(lockedLots.map((lot) => lot.shareCount)),
  }
}

function applyCashDistributions(
  lots: WorkingLot[],
  cashDistributions: ParsedCapitalRepaymentOrDividend[],
  shareCalculator: ShareCalculator,
  ipoDate: Date | undefined,
  mathematicalShareValuesByYear: Map<number, Decimal>,
  rules: OsakkeetTaxRules,
  warnings: string[],
  localization: OsakkeetLocalization,
  useYearlyRules: boolean
) {
  const capitalDividendUsedByYear = new Map<number, Decimal>()
  const grossDividendUsedByYear = new Map<number, Decimal>()
  const summaries: CashDistributionSummary[] = []
  const lotsById = new Map(lots.map((lot) => [lot.id, lot]))

  for (const entry of [...cashDistributions].sort((a, b) => compareDateStrings(a.date, b.date))) {
    const cashDistributionDate = entry.dateValue
    const amountPerShare = entry.amountPerShare
    const eligibleLots = lots.filter(
      (lot) => !lot.dateValue || !cashDistributionDate || lot.dateValue.getTime() <= cashDistributionDate.getTime()
    )
    const lotStates = eligibleLots.map((lot) => ({
      lot,
      before: cashDistributionDate
        ? getLotStateAtOrZero(shareCalculator, lot.id, cashDistributionDate, false)
        : getLatestLotStateOrZero(shareCalculator, lot.id),
      after: cashDistributionDate
        ? getLotStateAtOrZero(shareCalculator, lot.id, cashDistributionDate, true)
        : getLatestLotStateOrZero(shareCalculator, lot.id),
    }))
    const sharesHeld = sumDecimals(lotStates.map(({ before }) => before.shareCount))
    const expectedTotal = amountPerShare.mul(sharesHeld)
    const grossTotal = expectedTotal
    const effectivePerShare = sharesHeld.gt(0) ? grossTotal.div(sharesHeld) : zero
    const isAfterIpoDate = !!(ipoDate && cashDistributionDate && cashDistributionDate.getTime() >= ipoDate.getTime())
    const effectiveType: CashDistributionSummary['type'] = isAfterIpoDate ? 'dividend' : entry.type
    const year = cashDistributionDate?.getUTCFullYear()
    const distributionRules = resolveYearlyTaxRules(year, rules, useYearlyRules)

    if (sharesHeld.eq(0) && grossTotal.gt(0)) {
      warnings.push(localization.calculator.warnings.noSharesHeldForDistribution(entry.date))
    }

    const allocations = lotStates.map(({ lot, before, after }) => {
      const shares = before.shareCount
      const gross = effectivePerShare.mul(shares)
      const capitalRepayment = Decimal.max(before.shareAcquisitionCost.minus(after.shareAcquisitionCost), zero)
      const dividend = Decimal.max(gross.minus(capitalRepayment), zero)
      const eligibleCapitalRepayment =
        effectiveType === 'capital_return' &&
        isWithinYearsInclusive(
          lot.dateValue,
          cashDistributionDate,
          distributionRules.capitalRepayment.eligibilityYears
        ) &&
        capitalRepayment.gt(0)

      const targetLot = lotsById.get(lot.id)
      if (targetLot) {
        targetLot.cashDistributionGrossTotal = targetLot.cashDistributionGrossTotal.add(gross)
        targetLot.capitalRepaymentTotal = targetLot.capitalRepaymentTotal.add(capitalRepayment)
      }

      if (capitalRepayment.gt(0)) {
        targetLot?.capitalRepaymentBreakdown.push({
          distributionDate: entry.date,
          shares,
          capitalRepaymentPerShare: shares.gt(0) ? capitalRepayment.div(shares) : zero,
          capitalRepaymentTotal: capitalRepayment,
        })
      }

      if (entry.type === 'capital_return' && targetLot && shares.gt(0)) {
        const appliedCapitalRepaymentPerShare = shares.gt(0) ? capitalRepayment.div(shares) : zero
        const directedToDividendPerShare = shares.gt(0) ? dividend.div(shares) : zero
        const dividendReason =
          effectiveType !== 'capital_return'
            ? 'listed_dividend'
            : !isWithinYearsInclusive(
                  lot.dateValue,
                  cashDistributionDate,
                  distributionRules.capitalRepayment.eligibilityYears
                )
              ? 'too_old'
              : dividend.gt(0)
                ? before.shareAcquisitionCost.lte(0)
                  ? 'no_remaining_cost'
                  : 'remaining_cost_limit'
                : undefined

        targetLot.capitalRepaymentHoverEntries.push({
          distributionDate: entry.date,
          shares,
          inputAmountPerShare: amountPerShare,
          appliedCapitalRepaymentPerShare,
          appliedCapitalRepaymentTotal: capitalRepayment,
          directedToDividendPerShare,
          directedToDividendTotal: dividend,
          dividendReason,
        })
      }

      return {
        subscriptionId: lot.id,
        subscriptionDate: lot.date,
        shares,
        gross,
        capitalRepayment,
        dividend,
        remainingCostPerShareAfter: after.shareCount.gt(0) ? after.shareAcquisitionCost.div(after.shareCount) : zero,
        eligibleCapitalRepayment,
      } satisfies CashDistributionAllocation
    })

    const capitalRepaymentTotal = sumDecimals(allocations.map((allocation) => allocation.capitalRepayment))
    const dividendTotal = sumDecimals(allocations.map((allocation) => allocation.dividend))
    const mathematicalShareValuePerShare = year ? mathematicalShareValuesByYear.get(year) || zero : zero
    const shareholderMathematicalValue = mathematicalShareValuePerShare.mul(sharesHeld)
    const eightPercentYieldLimit = shareholderMathematicalValue.mul(
      distributionRules.unlistedDividend.mathematicalValueYieldRate
    )

    const capitalDividendGross = shareholderMathematicalValue.gt(0)
      ? Decimal.min(dividendTotal, eightPercentYieldLimit)
      : zero
    const earnedDividendGross = shareholderMathematicalValue.gt(0)
      ? Decimal.max(dividendTotal.minus(capitalDividendGross), zero)
      : zero
    const usedCapitalDividend = year ? capitalDividendUsedByYear.get(year) || zero : zero
    const lowerCapitalDividendRoom = Decimal.max(
      new Decimal(distributionRules.unlistedDividend.annualCapitalDividendThreshold).minus(usedCapitalDividend),
      zero
    )
    const lowCapitalPart = Decimal.min(capitalDividendGross, lowerCapitalDividendRoom)
    const highCapitalPart = Decimal.max(capitalDividendGross.minus(lowCapitalPart), zero)
    const taxableCapitalIncome = isAfterIpoDate
      ? dividendTotal.mul(distributionRules.listedDividend.taxableCapitalIncomeRate)
      : lowCapitalPart
          .mul(distributionRules.unlistedDividend.lowCapitalDividendTaxableRate)
          .add(highCapitalPart.mul(distributionRules.unlistedDividend.highCapitalDividendTaxableRate))
    const taxFreeCapitalIncomePortion = isAfterIpoDate
      ? dividendTotal.mul(distributionRules.listedDividend.taxFreeCapitalIncomeRate)
      : lowCapitalPart
          .mul(distributionRules.unlistedDividend.lowCapitalDividendTaxFreeRate)
          .add(highCapitalPart.mul(distributionRules.unlistedDividend.highCapitalDividendTaxFreeRate))
    const taxableEarnedDividend = isAfterIpoDate
      ? zero
      : earnedDividendGross.mul(distributionRules.unlistedDividend.earnedDividendTaxableRate)
    const taxFreeEarnedDividend = isAfterIpoDate
      ? zero
      : earnedDividendGross.mul(distributionRules.unlistedDividend.earnedDividendTaxFreeRate)

    const usedGrossDividend = year ? grossDividendUsedByYear.get(year) || zero : zero
    const lowerGrossDividendRoom = Decimal.max(
      new Decimal(distributionRules.unlistedDividend.withholdingThreshold).minus(usedGrossDividend),
      zero
    )
    const lowWithholdingPart = Decimal.min(dividendTotal, lowerGrossDividendRoom)
    const highWithholdingPart = Decimal.max(dividendTotal.minus(lowWithholdingPart), zero)
    const withholdingToTaxOffice = isAfterIpoDate
      ? dividendTotal.mul(distributionRules.listedDividend.withholdingRate)
      : lowWithholdingPart
          .mul(distributionRules.unlistedDividend.lowWithholdingRate)
          .add(highWithholdingPart.mul(distributionRules.unlistedDividend.highWithholdingRate))
    const paidInCash = grossTotal.minus(withholdingToTaxOffice)

    if (year && !isAfterIpoDate) {
      capitalDividendUsedByYear.set(year, usedCapitalDividend.add(capitalDividendGross))
      grossDividendUsedByYear.set(year, usedGrossDividend.add(dividendTotal))
    }

    const capitalRepaymentShareCount = sumDecimals(
      allocations.filter((allocation) => allocation.capitalRepayment.gt(0)).map((allocation) => allocation.shares)
    )
    const dividendShareCount = sumDecimals(
      allocations.filter((allocation) => allocation.dividend.gt(0)).map((allocation) => allocation.shares)
    )

    summaries.push({
      id: entry.id,
      date: entry.date,
      type: effectiveType,
      amountPerShare,
      sharesHeld,
      capitalRepaymentShareCount,
      dividendShareCount,
      mathematicalShareValuePerShare,
      shareholderMathematicalValue,
      eightPercentYieldLimit,
      expectedTotal,
      grossTotal,
      paidInCash,
      capitalRepaymentTotal,
      dividendTotal,
      withholdingToTaxOffice,
      taxableCapitalIncome,
      taxFreeCapitalIncomePortion,
      taxableEarnedDividend,
      taxFreeEarnedDividend,
      treatedAsListedDividend: isAfterIpoDate,
      allocations,
    } satisfies CashDistributionSummary)
  }

  return summaries
}

function calculateSellSummary(
  sellableLots: WorkingLot[],
  sellShareCalculator: ShareCalculator,
  sellAmount: Decimal,
  otherAnnualCapitalGainsOrLosses: Decimal,
  vestingSummary: VestingSummary,
  ipoSummary: IpoSummary,
  rules: OsakkeetTaxRules,
  errors: string[],
  warnings: string[],
  localization: OsakkeetLocalization,
  useYearlyRules: boolean
): SellSummary {
  const sellRules = resolveYearlyTaxRules(ipoSummary.ipoDate?.getUTCFullYear(), rules, useYearlyRules)
  if (sellAmount.gt(0) && !ipoSummary.ipoDate && vestingSummary.lockedLots.length > 0) {
    warnings.push(localization.calculator.warnings.vestingBlockedWithoutIpoDate)
  }
  if (sellAmount.gt(vestingSummary.vestedShares)) {
    errors.push(localization.calculator.errors.sellAmountExceedsSellable(vestingSummary.vestedShares.toString()))
  }
  if (ipoSummary.estimatedSecondaryShareCount.gt(0) && sellAmount.gt(ipoSummary.estimatedSecondaryShareCount)) {
    warnings.push(localization.calculator.warnings.sellAmountExceedsEstimatedSecondary)
  }

  const usedSubscriptions: SellLotSummary[] = sellableLots.flatMap((lot) => {
    const sellAllocations = (sellShareCalculator.sellsForThisSubscriptionLotsBySubscriptionId[lot.id] || []).filter(
      (allocation) => allocation.sellId === 'ipo-sell'
    )
    return sellAllocations.map((allocation) => {
      const soldAmount = allocation.soldShareCount
      const gross = soldAmount.mul(ipoSummary.ipoPricePerShare)
      const originalCostBasis = allocation.soldBaseShareAcquisitionCost
      const realCostBasis = allocation.soldShareAcquisitionCost
      const allocatedIpoCost = soldAmount.mul(ipoSummary.ipoCostPerShare)
      const actualDeduction = realCostBasis.add(allocatedIpoCost)
      const hankintamenoOlettaRate = isAtLeastYears(
        lot.dateValue,
        ipoSummary.ipoDate,
        sellRules.hankintamenoOlettama.ownershipYearsThreshold
      )
        ? new Decimal(sellRules.hankintamenoOlettama.longOwnershipRate)
        : new Decimal(sellRules.hankintamenoOlettama.shortOwnershipRate)
      const hankintamenoOlettaDeduction = gross.mul(hankintamenoOlettaRate)
      const useActualCosts = actualDeduction.gte(hankintamenoOlettaDeduction)
      const selectedDeduction = useActualCosts ? actualDeduction : hankintamenoOlettaDeduction
      const taxableGain = gross.minus(selectedDeduction)

      return {
        subscriptionId: lot.id,
        subscriptionDate: lot.date,
        totalSubscriptionShares: lot.shareCount,
        soldAmount,
        gross,
        originalCostBasis,
        realCostBasis,
        allocatedIpoCost,
        actualDeduction,
        hankintamenoOlettaRate,
        hankintamenoOlettaDeduction,
        selectedMethod: useActualCosts ? 'actual_costs' : 'hmo',
        selectedDeduction,
        taxableGain,
        taxFreeGainPart: zero,
        taxedGainPart: Decimal.max(taxableGain, zero),
      } satisfies SellLotSummary
    })
  })

  const taxableGainTotal = sumDecimals(usedSubscriptions.map((lot) => lot.taxableGain))
  const capitalIncomeThreshold = new Decimal(sellRules.capitalIncomeTax.threshold)
  const taxableGainAtLowRate = Decimal.max(Decimal.min(taxableGainTotal, capitalIncomeThreshold), zero)
  const taxableGainAtHighRate = Decimal.max(taxableGainTotal.minus(capitalIncomeThreshold), zero)
  const estimatedTax = estimateCapitalTax(taxableGainTotal, sellRules)
  const annualNetCapitalGain = Decimal.max(taxableGainTotal.add(otherAnnualCapitalGainsOrLosses), zero)
  const annualEstimatedTax = estimateCapitalTax(annualNetCapitalGain, sellRules)
  const annualTaxableGainAtLowRate = Decimal.max(Decimal.min(annualNetCapitalGain, capitalIncomeThreshold), zero)
  const annualTaxableGainAtHighRate = Decimal.max(annualNetCapitalGain.minus(capitalIncomeThreshold), zero)
  const annualTaxChange = annualEstimatedTax.minus(estimatedTax)
  const taxReductionFromOtherLosses = Decimal.max(estimatedTax.minus(annualEstimatedTax), zero)
  const grossTotal = sumDecimals(usedSubscriptions.map((lot) => lot.gross))
  const selectedActualDeductionTotal = sumDecimals(
    usedSubscriptions.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.actualDeduction)
  )
  const shortOwnershipRate = new Decimal(sellRules.hankintamenoOlettama.shortOwnershipRate)
  const longOwnershipRate = new Decimal(sellRules.hankintamenoOlettama.longOwnershipRate)
  const selectedHmo20DeductionTotal = sumDecimals(
    usedSubscriptions
      .filter((lot) => lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(shortOwnershipRate))
      .map((lot) => lot.hankintamenoOlettaDeduction)
  )
  const selectedHmo40DeductionTotal = sumDecimals(
    usedSubscriptions
      .filter((lot) => lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(longOwnershipRate))
      .map((lot) => lot.hankintamenoOlettaDeduction)
  )
  const selectedHmoDeductionTotal = selectedHmo20DeductionTotal.add(selectedHmo40DeductionTotal)
  const selectedDeductionTotal = sumDecimals(usedSubscriptions.map((lot) => lot.selectedDeduction))
  const soldSharesTotal = sumDecimals(usedSubscriptions.map((lot) => lot.soldAmount))
  const totalIpoCostAllocated = sumDecimals(usedSubscriptions.map((lot) => lot.allocatedIpoCost))
  const cashAfterIpoCosts = grossTotal.minus(totalIpoCostAllocated)
  const taxFreeAcquisitionRecoveryAfterIpoCosts = Decimal.max(selectedDeductionTotal.minus(totalIpoCostAllocated), zero)
  const soldShareOriginalCostTotal = sumDecimals(usedSubscriptions.map((lot) => lot.originalCostBasis))
  const soldShareAcquisitionCostTotal = sumDecimals(usedSubscriptions.map((lot) => lot.realCostBasis))
  const ipoCostDeductedViaActual = sumDecimals(
    usedSubscriptions.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.allocatedIpoCost)
  )
  const ipoCostPaidWithoutActualDeduction = sumDecimals(
    usedSubscriptions.filter((lot) => lot.selectedMethod === 'hmo').map((lot) => lot.allocatedIpoCost)
  )
  const taxSavedFromDeductibleIpoCosts = estimateCapitalTax(
    taxableGainTotal.add(ipoCostDeductedViaActual),
    sellRules
  ).minus(estimatedTax)
  const netAfterTaxAndIpoCost = grossTotal.minus(totalIpoCostAllocated).minus(estimatedTax)
  const netAfterAnnualTaxAndIpoCost = grossTotal.minus(totalIpoCostAllocated).minus(annualEstimatedTax)
  const netResultAgainstSubscriptionCost = netAfterTaxAndIpoCost.minus(soldShareAcquisitionCostTotal)

  return {
    amount: sellAmount,
    otherAnnualCapitalGainsOrLosses,
    usedSubscriptions,
    grossTotal,
    cashAfterIpoCosts,
    taxFreeAcquisitionRecoveryAfterIpoCosts,
    soldShareOriginalCostTotal,
    soldShareAcquisitionCostTotal,
    selectedActualDeductionTotal,
    selectedHmo20DeductionTotal,
    selectedHmo40DeductionTotal,
    selectedHmoDeductionTotal,
    selectedDeductionTotal,
    totalIpoCostAllocated,
    ipoCostDeductedViaActual,
    ipoCostPaidWithoutActualDeduction,
    taxSavedFromDeductibleIpoCosts,
    taxableGainTotal,
    taxableGainAtLowRate,
    taxableGainAtHighRate,
    estimatedTax,
    annualNetCapitalGain,
    annualTaxableGainAtLowRate,
    annualTaxableGainAtHighRate,
    annualEstimatedTax,
    annualTaxChange,
    taxReductionFromOtherLosses,
    netAfterTaxAndIpoCost,
    netAfterAnnualTaxAndIpoCost,
    netResultAgainstSubscriptionCost,
    remainingUnsoldShares: Decimal.max(ipoSummary.totalSubscribedShares.minus(soldSharesTotal), zero),
  }
}

function buildSubscriptionSummaries(lots: WorkingLot[]): SubscriptionSummary[] {
  return lots.map((lot) => ({
    id: lot.id,
    date: lot.date,
    amount: lot.shareCount,
    acquisitionCostExplanation: {
      originalAmount: lot.originalShareCount,
      originalPricePerShare: lot.originalSharePrice,
      originalOtherTotalAcquisitionCosts: lot.originalOtherTotalAcquisitionCosts,
      originalTotalPrice: lot.originalShareAcquisitionCost,
      adjustments: lot.acquisitionCostAdjustments,
    },
    totalPrice: lot.baseShareAcquisitionCost,
    totalPricePerShare: lot.shareCount.gt(0) ? lot.baseShareAcquisitionCost.div(lot.shareCount) : zero,
    cashDistributionGrossTotal: lot.cashDistributionGrossTotal,
    capitalRepaymentTotal: lot.capitalRepaymentTotal,
    capitalRepaymentBreakdown: lot.capitalRepaymentBreakdown,
    capitalRepaymentHoverEntries: lot.capitalRepaymentHoverEntries,
    shareCalculatorLog: lot.shareCalculatorLog,
    capitalRepaymentPerShare: lot.shareCount.gt(0) ? lot.capitalRepaymentTotal.div(lot.shareCount) : zero,
    remainingCostPerShare: lot.shareCount.gt(0) ? lot.shareAcquisitionCost.div(lot.shareCount) : zero,
    remainingCostTotal: lot.shareAcquisitionCost,
  }))
}

function createTaxReturnTotals(entries: CashDistributionSummary[]): TaxReturnTotals {
  return {
    paidInCash: sumDecimals(entries.map((row) => row.paidInCash)),
    withholdingToTaxOffice: sumDecimals(entries.map((row) => row.withholdingToTaxOffice)),
    capitalRepaymentTotal: sumDecimals(entries.map((row) => row.capitalRepaymentTotal)),
    dividendTotal: sumDecimals(entries.map((row) => row.dividendTotal)),
    taxableCapitalIncome: sumDecimals(entries.map((row) => row.taxableCapitalIncome)),
    taxFreeCapitalIncome: sumDecimals(entries.map((row) => row.taxFreeCapitalIncomePortion)),
    taxableEarnedDividend: sumDecimals(entries.map((row) => row.taxableEarnedDividend)),
    taxFreeEarnedDividend: sumDecimals(entries.map((row) => row.taxFreeEarnedDividend)),
  }
}

function createYearEndTimestamp(year: number) {
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
}

function buildTaxReturnAssetSummary(
  year: number,
  mathematicalShareValuePerShare: Decimal,
  subscriptionIds: string[],
  shareCalculator: ShareCalculator
) {
  const yearEndTimestamp = createYearEndTimestamp(year)
  const shareCount = sumDecimals(
    subscriptionIds.map(
      (subscriptionId) =>
        shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, yearEndTimestamp).remaining.shareCount
    )
  )
  const remainingAcquisitionCost = sumDecimals(
    subscriptionIds.map(
      (subscriptionId) =>
        shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, yearEndTimestamp).remaining
          .shareAcquisitionCost
    )
  )

  if (shareCount.lte(0) && remainingAcquisitionCost.lte(0) && mathematicalShareValuePerShare.lte(0)) {
    return undefined
  }

  return {
    date: `31.12.${year}`,
    shareCount,
    mathematicalShareValuePerShare,
    shareholderMathematicalValue: mathematicalShareValuePerShare.mul(shareCount),
    remainingAcquisitionCost,
  } satisfies TaxReturnAssetSummary
}

function buildTaxReturnYearSummaries(
  cashDistributions: CashDistributionSummary[],
  ipoDate: Date | undefined,
  sell: SellSummary,
  mathematicalShareValuesByYear: Map<number, Decimal>,
  shareCalculator: ShareCalculator
) {
  const yearSet = new Set<number>()
  cashDistributions.forEach((cashDistribution) => {
    const date = cashDistribution.date.match(/(\d{4})$/)?.[1]
    if (date) yearSet.add(Number(date))
  })
  const ipoYear = ipoDate?.getUTCFullYear()
  for (const year of mathematicalShareValuesByYear.keys()) {
    if (ipoYear != null && year >= ipoYear) continue
    yearSet.add(year)
  }
  if (ipoYear && sell.grossTotal.gt(0)) {
    yearSet.add(ipoYear)
  }

  const years = [...yearSet].sort((a, b) => a - b)
  return years.map((year) => {
    const yearEntries = cashDistributions.filter((cashDistribution) => cashDistribution.date.endsWith(String(year)))
    const unlistedEntries = yearEntries.filter((row) => !row.treatedAsListedDividend)
    const listedEntries = yearEntries.filter((row) => row.treatedAsListedDividend)
    const missingMathematicalValueWarningDates = unlistedEntries
      .filter((row) => row.dividendTotal.gt(0) && row.shareholderMathematicalValue.eq(0))
      .map((row) => row.date)
    const assets =
      ipoYear == null || year < ipoYear
        ? buildTaxReturnAssetSummary(
            year,
            mathematicalShareValuesByYear.get(year) || zero,
            shareCalculator.subscriptionIds,
            shareCalculator
          )
        : undefined

    return {
      year,
      missingMathematicalValueWarningDates,
      assets,
      unlisted:
        unlistedEntries.length > 0
          ? {
              mode: 'unlisted' as const,
              entries: unlistedEntries,
              totals: createTaxReturnTotals(unlistedEntries),
            }
          : undefined,
      listed:
        listedEntries.length > 0
          ? {
              mode: 'listed' as const,
              entries: listedEntries,
              totals: createTaxReturnTotals(listedEntries),
            }
          : undefined,
      ipoSale:
        ipoYear === year && sell.grossTotal.gt(0)
          ? {
              entries: sell.usedSubscriptions.map((entry) => ({
                subscriptionDate: entry.subscriptionDate,
                sellDate: ipoDate!.toISOString().slice(0, 10),
                soldShareCount: entry.soldAmount,
                grossSale: entry.gross,
                actualDeduction: entry.actualDeduction,
                hankintamenoOlettaDeduction: entry.hankintamenoOlettaDeduction,
                selectedMethod: entry.selectedMethod,
                selectedDeduction: entry.selectedDeduction,
                taxableCapitalGain: entry.taxableGain,
              })),
              soldShareCount: sumDecimals(sell.usedSubscriptions.map((entry) => entry.soldAmount)),
              grossSale: sell.grossTotal,
              actualDeductionTotal: sumDecimals(sell.usedSubscriptions.map((entry) => entry.actualDeduction)),
              hankintamenoOlettaDeductionTotal: sumDecimals(
                sell.usedSubscriptions.map((entry) => entry.hankintamenoOlettaDeduction)
              ),
              selectedDeductionTotal: sell.selectedDeductionTotal,
              totalIpoCostAllocated: sell.totalIpoCostAllocated,
              taxableCapitalGain: sell.taxableGainTotal,
              estimatedTax: sell.estimatedTax,
              netCash: sell.netAfterTaxAndIpoCost,
            }
          : undefined,
    } satisfies TaxReturnYearSummary
  })
}

export function calculateOsakkeet(
  form: OsakkeetFormData,
  localization: OsakkeetLocalization,
  rules?: OsakkeetTaxRules
): OsakkeetCalculation {
  const effectiveRules = rules || OSAKKEET_TAX_RULES_2026
  const useYearlyRules = rules == null
  const { parsed, errors } = parseOsakkeetCalculatorInputs(form, localization)
  const warnings: string[] = []
  const sortedSubscriptions = [...parsed.subscriptions].sort((a, b) => compareDateStrings(a.date, b.date))
  const sortedSells = [...parsed.sells].sort((a, b) => compareDateStrings(a.date, b.date))
  const baseLots = sortedSubscriptions.map((subscription) => createLot(subscription))
  const totalSubscribedCost = sumDecimals(baseLots.map((lot) => lot.baseShareAcquisitionCost))
  const { ipoDate, mathematicalShareValuesByYear } = parsed
  const { shareCalculator: baseShareCalculator, errors: baseShareCalculatorErrors } = createShareCalculator(
    {
      subscriptions: sortedSubscriptions,
      sells: sortedSells,
      shareSplits: parsed.shareSplits,
      demergers: parsed.demergers,
      cashDistributions: parsed.cashDistributions,
    },
    { capitalReturnCutoffDateExclusive: ipoDate }
  )
  mapShareCalculatorErrors(baseShareCalculatorErrors, errors)

  const ipoLots = baseLots.map((lot) => {
    const ipoState = ipoDate
      ? getLotStateAtOrZero(baseShareCalculator, lot.id, ipoDate, true)
      : getLatestLotStateOrZero(baseShareCalculator, lot.id)
    return {
      ...lot,
      shareCount: ipoState.shareCount,
      baseShareAcquisitionCost: ipoState.baseShareAcquisitionCost,
      shareAcquisitionCost: ipoState.shareAcquisitionCost,
    }
  })
  const totalSubscribedShares = sumDecimals(ipoLots.map((lot) => lot.shareCount))
  const { sellAmount, otherAnnualCapitalGainsOrLosses, ipo } = parseIpoAndSellInputs(
    parsed.ipo,
    parsed.sell,
    ipoDate,
    totalSubscribedShares,
    totalSubscribedCost,
    warnings,
    localization
  )
  collectUnsupportedYearWarnings(parsed.cashDistributions, ipoDate, sellAmount, warnings, localization, useYearlyRules)
  const vesting = calculateVestingSummary(ipoLots, ipoDate)
  const lots = buildFinalLotsFromShareCalculator(baseLots, baseShareCalculator)
  const currentVesting = calculateVestingSummary(lots, new Date())
  const cashDistributions = applyCashDistributions(
    lots,
    parsed.cashDistributions,
    baseShareCalculator,
    ipoDate,
    mathematicalShareValuesByYear,
    effectiveRules,
    warnings,
    localization,
    useYearlyRules
  )
  const sellableLotIds = new Set(vesting.sellableLots.map((lot) => lot.id))
  const ipoRelevantSells = ipoDate
    ? sortedSells.filter((sell) => compareDateStrings(sell.date, parsed.ipo.ipoDateText) <= 0)
    : sortedSells
  const { shareCalculator: sellShareCalculator, errors: sellShareCalculatorErrors } = createShareCalculator(
    {
      subscriptions: sortedSubscriptions.filter((subscription) => sellableLotIds.has(subscription.id)),
      sells:
        ipoDate && sellAmount.gt(0)
          ? [
              ...ipoRelevantSells,
              {
                kind: 'sell' as const,
                id: 'ipo-sell',
                date: parsed.ipo.ipoDateText,
                parsedTimestamp: parseEventTimestamp(parsed.ipo.ipoDateText),
                shareCount: sellAmount,
                sellPrice: sellAmount.mul(ipo.ipoPricePerShare),
                pricePerShare: ipo.ipoPricePerShare,
              },
            ]
          : ipoRelevantSells,
      shareSplits: parsed.shareSplits,
      demergers: parsed.demergers,
      cashDistributions: parsed.cashDistributions,
    },
    { capitalReturnCutoffDateExclusive: ipoDate }
  )
  mapShareCalculatorErrors(sellShareCalculatorErrors, errors)
  const sell = calculateSellSummary(
    vesting.sellableLots,
    sellShareCalculator,
    sellAmount,
    otherAnnualCapitalGainsOrLosses,
    vesting,
    ipo,
    effectiveRules,
    errors,
    warnings,
    localization,
    useYearlyRules
  )

  return {
    formData: form,
    warnings,
    errors,
    subscriptions: buildSubscriptionSummaries(lots),
    cashDistributions,
    vesting,
    currentVesting,
    ipo,
    sell,
    taxReturns: {
      years: buildTaxReturnYearSummaries(
        cashDistributions,
        ipoDate,
        sell,
        mathematicalShareValuesByYear,
        baseShareCalculator
      ),
    },
  }
}
