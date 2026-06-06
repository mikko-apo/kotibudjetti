import Decimal from 'decimal.js'
import type { CashDistributionAllocation, CashDistributionSummary } from './osakkeetCashDistributionTypes'
import { type OsakkeetLocalization } from './osakkeetLocalizations'
import {
  buildIpoSummaryFromInputs,
  calculateIpoSellSummary,
  calculateVestingSummary,
  type IpoSummary,
  type VestingSummary,
} from './osakkeetIpoCalculator'
import {
  parseEventTimestamp,
  parseOsakkeetCalculatorInputs,
  parseOsakkeetIpoCalculatorInputs,
  type AcquisitionCostAdjustment,
  type ParsedCapitalRepaymentOrDividend,
  type ParsedSubscription,
  type WorkingLot,
} from './osakkeetParsedData'
import { calculateSellSummary, type SellSummary } from './osakkeetSellCalculator'
import type {
  TaxReturnAssetSummary,
  TaxReturnSaleSummary,
  TaxReturnSectionSummary,
  TaxReturnTotals,
  TaxReturnYearSummary,
} from './osakkeetTaxReturnTypes'
import type { OsakkeetFormData } from './osakkeetTypes'
import { createShareCalculator, type ShareCalculator, type ShareCalculatorError } from './shareCalculator'
import { compareDateStrings, isWithinYearsInclusive, sumDecimals } from './osakkeetUtils'

export type OsakkeetCalculation = {
  formData: OsakkeetFormData
  warnings: string[]
  errors: string[]
  subscriptions: WorkingLot[]
  cashDistributions: CashDistributionSummary[]
  vesting: Omit<VestingSummary, 'sellableLots' | 'lockedLots'>
  currentVesting: Omit<VestingSummary, 'sellableLots' | 'lockedLots'>
  ipo: IpoSummary
  ipoSell: SellSummary
  taxReturns: {
    years: TaxReturnYearSummary<CashDistributionSummary>[]
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

type WorkingLotStateSnapshot = Pick<WorkingLot, 'shareCount' | 'baseShareAcquisitionCost' | 'shareAcquisitionCost'>

function resolveYearlyTaxRules(year: number | undefined, fallbackRules: OsakkeetTaxRules, useYearlyRules: boolean) {
  if (!useYearlyRules || year == null || year < OSAKKEET_TAX_RULES_2016.year) {
    return fallbackRules
  }
  return yearlyTaxCalculator(year)
}

function collectUnsupportedYearWarnings(
  cashDistributions: ParsedCapitalRepaymentOrDividend[],
  ipoDate: Date | undefined,
  ipoSellAmount: Decimal,
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
  if (ipoYear != null && ipoYear < OSAKKEET_TAX_RULES_2016.year && ipoSellAmount.gt(0)) {
    unsupportedYears.add(ipoYear)
  }
  ;[...unsupportedYears]
    .sort((a, b) => a - b)
    .forEach((year) => warnings.push(localization.calculator.warnings.unsupportedYearRange(year)))
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
  } satisfies WorkingLotStateSnapshot
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
  } satisfies WorkingLotStateSnapshot
}

function deriveWorkingLot(
  lot: WorkingLot,
  shareCalculator: ShareCalculator,
  options: {
    atDate?: Date
    inclusive?: boolean
    includeShareCalculatorLog?: boolean
    includeAcquisitionCostAdjustments?: boolean
    resetCapitalRepaymentTracking?: boolean
  } = {}
) {
  const {
    atDate,
    inclusive = true,
    includeShareCalculatorLog = false,
    includeAcquisitionCostAdjustments = false,
    resetCapitalRepaymentTracking = false,
  } = options
  const state = atDate
    ? getLotStateAtOrZero(shareCalculator, lot.id, atDate, inclusive)
    : getLatestLotStateOrZero(shareCalculator, lot.id)

  return {
    ...lot,
    ...state,
    ...(resetCapitalRepaymentTracking ? { capitalRepaymentTotal: zero } : {}),
    ...(includeShareCalculatorLog ? { shareCalculatorLog: buildShareCalculatorLog(lot.id, shareCalculator) } : {}),
    ...(includeAcquisitionCostAdjustments
      ? { acquisitionCostAdjustments: buildAcquisitionCostAdjustments(lot, shareCalculator) }
      : {}),
  } satisfies WorkingLot
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
  return baseLots.map((lot) =>
    deriveWorkingLot(lot, shareCalculator, {
      includeShareCalculatorLog: true,
      includeAcquisitionCostAdjustments: true,
      resetCapitalRepaymentTracking: true,
    })
  )
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
  sales: TaxReturnSaleSummary[],
  ipoDate: Date | undefined,
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
  sales.forEach((sale) => yearSet.add(sale.year))

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
          ? ({
              mode: 'unlisted' as const,
              entries: unlistedEntries,
              totals: createTaxReturnTotals(unlistedEntries),
            } satisfies TaxReturnSectionSummary<CashDistributionSummary>)
          : undefined,
      listed:
        listedEntries.length > 0
          ? ({
              mode: 'listed' as const,
              entries: listedEntries,
              totals: createTaxReturnTotals(listedEntries),
            } satisfies TaxReturnSectionSummary<CashDistributionSummary>)
          : undefined,
      sales: sales.filter((sale) => sale.year === year),
    } satisfies TaxReturnYearSummary<CashDistributionSummary>
  })
}

function buildTaxReturnSaleSummaries(
  sells: ReturnType<typeof parseOsakkeetCalculatorInputs>['parsed']['sells'],
  baseLots: WorkingLot[],
  shareCalculator: ShareCalculator,
  ipoDate: Date | undefined,
  ipoSell: SellSummary,
  effectiveRules: OsakkeetTaxRules,
  useYearlyRules: boolean
) {
  const historicalSales: TaxReturnSaleSummary[] = sells.flatMap((sell) => {
    if (!sell.parsedTimestamp) return []
    const sellDate = new Date(sell.parsedTimestamp.timestampMs)
    const sellableLots = baseLots
      .map((lot) => deriveWorkingLot(lot, shareCalculator, { atDate: sellDate, inclusive: false }))
      .filter((lot) => lot.shareCount.gt(0))
    const totalTrackedShares = sumDecimals(sellableLots.map((lot) => lot.shareCount))
    const sellRules = resolveYearlyTaxRules(sellDate.getUTCFullYear(), effectiveRules, useYearlyRules)
    const summary = calculateSellSummary({
      sellableLots,
      totalTrackedShares,
      sellShareCalculator: shareCalculator,
      sellId: sell.id,
      sellAmount: sell.shareCount,
      otherAnnualCapitalGainsOrLosses: zero,
      sellDate,
      sellPricePerShare: sell.pricePerShare,
      sellCostPerShare: sell.shareCount.gt(0) ? sell.otherTotalSellCosts.div(sell.shareCount) : zero,
      sellRules,
    })

    return summary.grossTotal.gt(0)
      ? [
          {
            year: sellDate.getUTCFullYear(),
            sellDate: sell.date,
            summary,
          } satisfies TaxReturnSaleSummary,
        ]
      : []
  })

  if (!ipoDate || !ipoSell.grossTotal.gt(0)) {
    return historicalSales
  }

  return [
    ...historicalSales,
    {
      year: ipoDate.getUTCFullYear(),
      sellDate: ipoDate.toISOString().slice(0, 10),
      summary: ipoSell,
    } satisfies TaxReturnSaleSummary,
  ]
}

export function calculateOsakkeet(
  form: OsakkeetFormData,
  localization: OsakkeetLocalization,
  rules?: OsakkeetTaxRules
): OsakkeetCalculation {
  const effectiveRules = rules || OSAKKEET_TAX_RULES_2026
  const useYearlyRules = rules == null
  const { parsed, errors } = parseOsakkeetCalculatorInputs(form, localization)
  const { parsed: parsedIpo, errors: ipoErrors } = parseOsakkeetIpoCalculatorInputs(form, localization)
  errors.push(...ipoErrors)
  const warnings: string[] = []
  const sortedSubscriptions = [...parsed.subscriptions].sort((a, b) => compareDateStrings(a.date, b.date))
  const sortedSells = [...parsed.sells].sort((a, b) => compareDateStrings(a.date, b.date))
  const baseLots = sortedSubscriptions.map((subscription) => createLot(subscription))
  const totalSubscribedCost = sumDecimals(baseLots.map((lot) => lot.baseShareAcquisitionCost))
  const { mathematicalShareValuesByYear } = parsed
  const ipoDate = parsed.company.becameListedDate
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

  const ipoLots = baseLots.map((lot) =>
    deriveWorkingLot(lot, baseShareCalculator, { atDate: ipoDate, inclusive: true })
  )
  const totalSubscribedShares = sumDecimals(ipoLots.map((lot) => lot.shareCount))
  const { ipoSellAmount, otherAnnualCapitalGainsOrLosses, ipo } = buildIpoSummaryFromInputs(
    parsedIpo.ipo,
    parsedIpo.ipoSell,
    ipoDate,
    totalSubscribedShares,
    totalSubscribedCost,
    warnings,
    localization
  )
  collectUnsupportedYearWarnings(
    parsed.cashDistributions,
    ipoDate,
    ipoSellAmount,
    warnings,
    localization,
    useYearlyRules
  )
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
    ? sortedSells.filter((sell) => compareDateStrings(sell.date, parsed.company.becameListedDateText) <= 0)
    : sortedSells
  const { shareCalculator: sellShareCalculator, errors: sellShareCalculatorErrors } = createShareCalculator(
    {
      subscriptions: sortedSubscriptions.filter((subscription) => sellableLotIds.has(subscription.id)),
      sells:
        ipoDate && ipoSellAmount.gt(0)
          ? [
              ...ipoRelevantSells,
              {
                kind: 'sell' as const,
                id: 'ipo-sell',
                date: parsed.company.becameListedDateText,
                parsedTimestamp: parseEventTimestamp(parsed.company.becameListedDateText),
                shareCount: ipoSellAmount,
                sellPrice: ipoSellAmount.mul(ipo.ipoPricePerShare),
                pricePerShare: ipo.ipoPricePerShare,
                otherTotalSellCosts: zero,
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
  const sellRules = resolveYearlyTaxRules(ipo.ipoDate?.getUTCFullYear(), effectiveRules, useYearlyRules)
  const ipoSell = calculateIpoSellSummary(
    vesting.sellableLots,
    sellShareCalculator,
    ipoSellAmount,
    parsedIpo.ipoSell.pricePerShare,
    parsedIpo.ipoSell.costPerShare,
    otherAnnualCapitalGainsOrLosses,
    vesting,
    ipo,
    sellRules,
    errors,
    warnings,
    localization
  )
  const taxReturnSales = buildTaxReturnSaleSummaries(
    sortedSells,
    baseLots,
    baseShareCalculator,
    ipoDate,
    ipoSell,
    effectiveRules,
    useYearlyRules
  )

  return {
    formData: form,
    warnings,
    errors,
    subscriptions: lots,
    cashDistributions,
    vesting,
    currentVesting,
    ipo,
    ipoSell,
    taxReturns: {
      years: buildTaxReturnYearSummaries(
        cashDistributions,
        taxReturnSales,
        ipoDate,
        mathematicalShareValuesByYear,
        baseShareCalculator
      ),
    },
  }
}
