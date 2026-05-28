import Decimal from 'decimal.js'
import { type OsakkeetLocalization } from './osakkeetLocalizations'
import {
  compareDateStrings,
  isAtLeastYears,
  isWithinYearsInclusive,
  parseSupportedDate,
  sumDecimals,
} from './osakkeetUtils'

type ShareSubscriptionInput = {
  id: string
  date: string
  vestingEndsOn?: string
  amount: string
  pricePerShare?: string
  otherTotalAcquisitionCosts?: string
  totalPrice?: string
}

type CashDistributionInput = {
  id: string
  date: string
  type: 'capital_return' | 'dividend'
  amountPerShare: string
  shareCount?: string
}

type ShareSplitInput = {
  id: string
  date: string
  multiplier: string
}

type DemergerInput = {
  id: string
  date: string
  oldCompanyRatio: string
}

type MathematicalShareValueInput = {
  id: string
  year: string
  valuePerShare: string
}

type IpoDetailsInput = {
  ipoDate: string
  totalShareCount: string
  totalIpoCost: string
  currentShareValue: string
  estimatedPreIpoValue: string
  estimatedSecondaryShareSellPercentage: string
}

type IpoSellDetailsInput = {
  amount: string
  otherAnnualCapitalGainsOrLosses?: string
}

export type OsakkeetFormData = {
  subscriptions: ShareSubscriptionInput[]
  cashDistributions: CashDistributionInput[]
  shareSplits: ShareSplitInput[]
  demergers: DemergerInput[]
  mathematicalShareValues: MathematicalShareValueInput[]
  ipo: IpoDetailsInput
  sell: IpoSellDetailsInput
}

type WorkingLot = {
  id: string
  date: string
  dateValue?: Date
  vestingEndsOn?: string
  vestingEndsOnValue?: Date
  amount: Decimal
  originalAmount: Decimal
  originalPricePerShare: Decimal
  originalOtherTotalAcquisitionCosts: Decimal
  originalTotalPrice: Decimal
  totalPrice: Decimal
  remainingCostTotal: Decimal
  capitalRepaymentTotal: Decimal
  cashDistributionGrossTotal: Decimal
  capitalRepaymentBreakdown: CapitalRepaymentBreakdown[]
  acquisitionCostAdjustments: AcquisitionCostAdjustment[]
}

type ParsedCashDistribution = {
  id: string
  date: string
  dateValue?: Date
  type: 'capital_return' | 'dividend'
  amountPerShare: Decimal
}

type ParsedShareSplit = {
  id: string
  date: string
  dateValue?: Date
  multiplier: Decimal
}

type ParsedDemerger = {
  id: string
  date: string
  dateValue?: Date
  oldCompanyRatio: Decimal
}

export type CapitalRepaymentBreakdown = {
  distributionDate: string
  shares: Decimal
  capitalRepaymentPerShare: Decimal
  capitalRepaymentTotal: Decimal
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

type TaxReturnIpoSaleSummary = {
  grossSale: Decimal
  totalIpoCostAllocated: Decimal
  taxableCapitalGain: Decimal
  estimatedTax: Decimal
  netCash: Decimal
}

type TaxReturnYearSummary = {
  year: number
  missingMathematicalValueWarningDates: string[]
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

const YEARLY_TAX_RULES: YearlyTaxRules[] = [
  OSAKKEET_TAX_RULES_2016,
]

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

type DecimalParseOptions = {
  allowNegative?: boolean
  validate?: (value: Decimal) => boolean
}

function parseDecimalInput(
  value: string,
  field: string,
  errors: string[],
  localization: OsakkeetLocalization,
  options: DecimalParseOptions = {}
) {
  const normalized = value.trim()
  if (normalized === '') return zero
  try {
    const parsed = new Decimal(normalized)
    if (!options.allowNegative && parsed.isNegative()) {
      errors.push(localization.calculator.validation.negative(field))
    }
    if (options.validate && !options.validate(parsed)) {
      errors.push(localization.calculator.validation.invalidNumber(field))
    }
    return parsed
  } catch {
    errors.push(localization.calculator.validation.invalidNumber(field))
    return zero
  }
}

function parseOptionalDateInput(value: string, field: string, errors: string[], localization: OsakkeetLocalization) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const date = parseSupportedDate(trimmed)
  if (!date || Number.isNaN(date.getTime())) {
    errors.push(localization.calculator.validation.invalidDate(field))
    return undefined
  }
  return date
}

function createLot(input: ShareSubscriptionInput, errors: string[], localization: OsakkeetLocalization) {
  const amount = parseDecimalInput(
    input.amount,
    localization.calculator.fields.subscriptionAmount(input.date || input.id),
    errors,
    localization
  )
  const pricePerShare = parseDecimalInput(
    input.pricePerShare || '',
    localization.calculator.fields.subscriptionPricePerShare(input.date || input.id),
    errors,
    localization
  )
  const otherTotalAcquisitionCosts = parseDecimalInput(
    input.otherTotalAcquisitionCosts || '',
    localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(input.date || input.id),
    errors,
    localization
  )
  const fallbackTotalPrice = parseDecimalInput(
    input.totalPrice || '',
    localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(input.date || input.id),
    [],
    localization
  )
  const totalPrice = amount.mul(pricePerShare).add(otherTotalAcquisitionCosts)
  const effectiveTotalPrice =
    totalPrice.gt(0) || input.pricePerShare || input.otherTotalAcquisitionCosts ? totalPrice : fallbackTotalPrice
  return {
    id: input.id,
    date: input.date,
    dateValue: parseOptionalDateInput(
      input.date,
      localization.calculator.fields.subscriptionDate(input.id),
      errors,
      localization
    ),
    vestingEndsOn: input.vestingEndsOn || '',
    vestingEndsOnValue: parseOptionalDateInput(
      input.vestingEndsOn || '',
      localization.calculator.fields.subscriptionVestingEndsOn(input.id),
      errors,
      localization
    ),
    amount,
    originalAmount: amount,
    originalPricePerShare: pricePerShare,
    originalOtherTotalAcquisitionCosts: otherTotalAcquisitionCosts,
    originalTotalPrice: effectiveTotalPrice,
    totalPrice: effectiveTotalPrice,
    remainingCostTotal: effectiveTotalPrice,
    capitalRepaymentTotal: zero,
    cashDistributionGrossTotal: zero,
    capitalRepaymentBreakdown: [],
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

function resolveYearlyTaxRules(
  year: number | undefined,
  fallbackRules: OsakkeetTaxRules,
  useYearlyRules: boolean
) {
  if (!useYearlyRules || year == null || year < OSAKKEET_TAX_RULES_2016.year) {
    return fallbackRules
  }
  return yearlyTaxCalculator(year)
}

function collectUnsupportedYearWarnings(
  form: OsakkeetFormData,
  ipoDate: Date | undefined,
  sellAmount: Decimal,
  warnings: string[],
  localization: OsakkeetLocalization,
  useYearlyRules: boolean
) {
  if (!useYearlyRules) return

  const unsupportedYears = new Set<number>()
  form.cashDistributions.forEach((entry) => {
    const date = parseSupportedDate(entry.date.trim())
    const year = date?.getUTCFullYear()
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

function createMathematicalShareValuesByYear(
  rows: MathematicalShareValueInput[],
  errors: string[],
  localization: OsakkeetLocalization
) {
  const mathematicalShareValuesByYear = new Map<number, Decimal>()
  for (const row of rows) {
    const year = parseDecimalInput(
      row.year,
      localization.calculator.fields.mathematicalShareValueYear(row.id),
      errors,
      localization
    )
    const valuePerShare = parseDecimalInput(
      row.valuePerShare,
      localization.calculator.fields.mathematicalShareValuePerShare(row.id),
      errors,
      localization
    )
    if (year.gt(0)) {
      mathematicalShareValuesByYear.set(year.toNumber(), valuePerShare)
    }
  }
  return mathematicalShareValuesByYear
}

function createParsedCashDistributions(
  rows: CashDistributionInput[] = [],
  errors: string[],
  localization: OsakkeetLocalization
) {
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    dateValue: parseOptionalDateInput(
      row.date,
      localization.calculator.fields.cashDistributionDate(row.id),
      errors,
      localization
    ),
    type: row.type,
    amountPerShare: parseDecimalInput(
      row.amountPerShare,
      localization.calculator.fields.cashDistributionAmountPerShare(row.id),
      errors,
      localization
    ),
  }))
}

function parseDatedDecimalAction<TParsed extends { id: string; date: string; dateValue?: Date }>(
  row: { id: string; date: string },
  rawValue: string,
  valueField: string,
  dateField: string,
  errors: string[],
  localization: OsakkeetLocalization,
  isValid: (value: Decimal) => boolean,
  build: (value: Decimal, dateValue: Date | undefined) => TParsed
) {
  const normalizedDate = row.date.trim()
  const normalizedValue = rawValue.trim()
  if (normalizedDate === '' && normalizedValue === '') {
    return build(zero, undefined)
  }

  const parsedValue =
    normalizedValue === ''
      ? (errors.push(localization.calculator.validation.invalidNumber(valueField)), zero)
      : parseDecimalInput(rawValue, valueField, errors, localization, { validate: isValid })

  return build(parsedValue, parseOptionalDateInput(row.date, dateField, errors, localization))
}

function createParsedShareSplits(rows: ShareSplitInput[] = [], errors: string[], localization: OsakkeetLocalization) {
  return rows.map((row) =>
    parseDatedDecimalAction(
      row,
      row.multiplier,
      localization.calculator.fields.shareSplitMultiplier(row.id),
      localization.calculator.fields.shareSplitDate(row.id),
      errors,
      localization,
      (value) => value.gt(0),
      (multiplier, dateValue) =>
        ({
          id: row.id,
          date: row.date,
          dateValue,
          multiplier,
        }) satisfies ParsedShareSplit
    )
  )
}

function createParsedDemergers(rows: DemergerInput[] = [], errors: string[], localization: OsakkeetLocalization) {
  return rows.map((row) =>
    parseDatedDecimalAction(
      row,
      row.oldCompanyRatio,
      localization.calculator.fields.demergerOldCompanyRatio(row.id),
      localization.calculator.fields.demergerDate(row.id),
      errors,
      localization,
      (value) => value.gt(0) && value.lte(1),
      (oldCompanyRatio, dateValue) =>
        ({
          id: row.id,
          date: row.date,
          dateValue,
          oldCompanyRatio,
        }) satisfies ParsedDemerger
    )
  )
}

function cloneLots(lots: WorkingLot[]) {
  return lots.map((lot) => ({
    ...lot,
    capitalRepaymentBreakdown: lot.capitalRepaymentBreakdown.map((entry) => ({ ...entry })),
    acquisitionCostAdjustments: lot.acquisitionCostAdjustments.map((entry) => ({ ...entry })),
  }))
}

function applyToOwnedLots(lots: WorkingLot[], eventDate: Date | undefined, apply: (lot: WorkingLot) => void) {
  if (!eventDate) return
  for (const lot of lots) {
    if (lot.dateValue && lot.dateValue.getTime() > eventDate.getTime()) continue
    apply(lot)
  }
}

function applyShareSplit(lots: WorkingLot[], entry: ParsedShareSplit) {
  if (entry.multiplier.lte(0)) return
  applyToOwnedLots(lots, entry.dateValue, (lot) => {
    const beforeShares = lot.amount
    lot.amount = lot.amount.mul(entry.multiplier)
    lot.acquisitionCostAdjustments.push({
      kind: 'split',
      date: entry.date,
      beforeShares,
      afterShares: lot.amount,
      multiplier: entry.multiplier,
    })
  })
}

function applyShareSplitsToLots(lots: WorkingLot[], shareSplits: ParsedShareSplit[], upToDate?: Date) {
  for (const entry of shareSplits
    .filter((shareSplit) => {
      if (!upToDate) return true
      return !!shareSplit.dateValue && shareSplit.dateValue.getTime() <= upToDate.getTime()
    })
    .sort((a, b) => compareDateStrings(a.date, b.date))) {
    applyShareSplit(lots, entry)
  }
}

function applyDemerger(lots: WorkingLot[], entry: ParsedDemerger) {
  if (entry.oldCompanyRatio.lte(0) || entry.oldCompanyRatio.gt(1)) return
  applyToOwnedLots(lots, entry.dateValue, (lot) => {
    const beforeTotalPrice = lot.totalPrice
    lot.totalPrice = lot.totalPrice.mul(entry.oldCompanyRatio)
    lot.remainingCostTotal = lot.remainingCostTotal.mul(entry.oldCompanyRatio)
    lot.acquisitionCostAdjustments.push({
      kind: 'demerger',
      date: entry.date,
      beforeTotalPrice,
      afterTotalPrice: lot.totalPrice,
      oldCompanyRatio: entry.oldCompanyRatio,
    })
  })
}

type TimelineEvent =
  | { kind: 'split'; date: string; entry: ParsedShareSplit }
  | { kind: 'demerger'; date: string; entry: ParsedDemerger }
  | { kind: 'distribution'; date: string; entry: ParsedCashDistribution }

function isEventWithinTimeline(dateValue: Date | undefined, ipoDate: Date | undefined, stopAtIpoDate?: boolean) {
  if (!stopAtIpoDate || !ipoDate) return true
  return !!dateValue && dateValue.getTime() <= ipoDate.getTime()
}

function createTimelineEvents(
  cashDistributions: ParsedCashDistribution[],
  shareSplits: ParsedShareSplit[],
  demergers: ParsedDemerger[],
  ipoDate: Date | undefined,
  options: { stopAtIpoDate?: boolean } = {}
) {
  return [
    ...shareSplits
      .filter((entry) => isEventWithinTimeline(entry.dateValue, ipoDate, options.stopAtIpoDate))
      .map((entry) => ({ kind: 'split' as const, date: entry.date, entry })),
    ...demergers
      .filter((entry) => isEventWithinTimeline(entry.dateValue, ipoDate, options.stopAtIpoDate))
      .map((entry) => ({ kind: 'demerger' as const, date: entry.date, entry })),
    ...cashDistributions
      .filter((entry) => {
        if (!options.stopAtIpoDate || !ipoDate) return true
        return !!entry.dateValue && entry.dateValue.getTime() < ipoDate.getTime()
      })
      .map((entry) => ({ kind: 'distribution' as const, date: entry.date, entry })),
  ].sort((a, b) => {
    const dateComparison = compareDateStrings(a.date, b.date)
    if (dateComparison !== 0) return dateComparison
    if (a.kind === b.kind) return 0
    if (a.kind === 'distribution') return 1
    if (b.kind === 'distribution') return -1
    return 0
  }) satisfies TimelineEvent[]
}

function parseIpoAndSellInputs(
  form: OsakkeetFormData,
  ipoDate: Date | undefined,
  totalSubscribedShares: Decimal,
  totalSubscribedCost: Decimal,
  errors: string[],
  warnings: string[],
  localization: OsakkeetLocalization
) {
  const totalShareCountInput = parseDecimalInput(
    form.ipo.totalShareCount,
    localization.calculator.fields.totalShareCount,
    errors,
    localization
  )
  const totalShareCount = totalShareCountInput.gt(0) ? totalShareCountInput : totalSubscribedShares
  const totalIpoCost = parseDecimalInput(
    form.ipo.totalIpoCost,
    localization.calculator.fields.totalIpoCost,
    errors,
    localization
  )
  const currentShareValue = parseDecimalInput(
    form.ipo.currentShareValue,
    localization.calculator.fields.currentShareValue,
    errors,
    localization
  )
  const currentTotalValue = currentShareValue.mul(totalShareCount)
  const estimatedPreIpoValue = parseDecimalInput(
    form.ipo.estimatedPreIpoValue,
    localization.calculator.fields.estimatedPreIpoValue,
    errors,
    localization
  )
  const estimatedSecondaryShareSellPercentage = parseDecimalInput(
    form.ipo.estimatedSecondaryShareSellPercentage,
    localization.calculator.fields.estimatedSecondaryShareSellPercentage,
    errors,
    localization
  )
  const sellAmount = parseDecimalInput(form.sell.amount, localization.calculator.fields.sellAmount, errors, localization)
  const otherAnnualCapitalGainsOrLosses = parseDecimalInput(
    form.sell.otherAnnualCapitalGainsOrLosses || '',
    localization.calculator.fields.otherAnnualCapitalGainsOrLosses,
    errors,
    localization,
    { allowNegative: true }
  )

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
    (lot) => !lot.vestingEndsOnValue || !!(ipoDate && ipoDate.getTime() >= lot.vestingEndsOnValue.getTime())
  )
  const lockedLots = ipoEligibleLots.filter(
    (lot) => !!lot.vestingEndsOnValue && (!ipoDate || ipoDate.getTime() < lot.vestingEndsOnValue.getTime())
  )
  return {
    sellableLots,
    lockedLots,
    totalShares: sumDecimals(ipoEligibleLots.map((lot) => lot.amount)),
    vestedShares: sumDecimals(sellableLots.map((lot) => lot.amount)),
    unvestedShares: sumDecimals(lockedLots.map((lot) => lot.amount)),
  }
}

function applyCashDistributions(
  lots: WorkingLot[],
  cashDistributions: ParsedCashDistribution[],
  shareSplits: ParsedShareSplit[],
  demergers: ParsedDemerger[],
  ipoDate: Date | undefined,
  mathematicalShareValuesByYear: Map<number, Decimal>,
  rules: OsakkeetTaxRules,
  warnings: string[],
  localization: OsakkeetLocalization,
  useYearlyRules: boolean,
  options: { stopAtIpoDate?: boolean } = {}
) {
  const capitalDividendUsedByYear = new Map<number, Decimal>()
  const grossDividendUsedByYear = new Map<number, Decimal>()
  const events = createTimelineEvents(cashDistributions, shareSplits, demergers, ipoDate, options)
  const summaries: CashDistributionSummary[] = []

  for (const event of events) {
    if (event.kind === 'split') {
      applyShareSplit(lots, event.entry)
      continue
    }
    if (event.kind === 'demerger') {
      applyDemerger(lots, event.entry)
      continue
    }

    const entry = event.entry
    const cashDistributionDate = entry.dateValue
    const amountPerShare = entry.amountPerShare
    const eligibleLots = lots.filter(
      (lot) => !lot.dateValue || !cashDistributionDate || lot.dateValue.getTime() <= cashDistributionDate.getTime()
    )
    const sharesHeld = sumDecimals(eligibleLots.map((lot) => lot.amount))
    const expectedTotal = amountPerShare.mul(sharesHeld)
    const grossTotal = expectedTotal
    const effectivePerShare = sharesHeld.gt(0) ? grossTotal.div(sharesHeld) : zero
    const isAfterIpoDate = !!(ipoDate && cashDistributionDate && cashDistributionDate.getTime() >= ipoDate.getTime())
    const effectiveType: CashDistributionSummary['type'] = isAfterIpoDate ? 'dividend' : entry.type
    const isDividend = effectiveType === 'dividend'
    const year = cashDistributionDate?.getUTCFullYear()
    const distributionRules = resolveYearlyTaxRules(year, rules, useYearlyRules)

    if (sharesHeld.eq(0) && grossTotal.gt(0)) {
      warnings.push(localization.calculator.warnings.noSharesHeldForDistribution(entry.date))
    }

    const allocations = eligibleLots.map((lot) => {
      const gross = effectivePerShare.mul(lot.amount)
      const eligibleCapitalRepayment =
        !isDividend &&
        isWithinYearsInclusive(
          lot.dateValue,
          cashDistributionDate,
          distributionRules.capitalRepayment.eligibilityYears
        ) &&
        lot.remainingCostTotal.gt(0)
      const remainingCostPerShare = lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero
      const capitalRepaymentPerShare = eligibleCapitalRepayment
        ? Decimal.min(effectivePerShare, remainingCostPerShare)
        : zero
      const capitalRepayment = capitalRepaymentPerShare.mul(lot.amount)
      const dividend = Decimal.max(gross.minus(capitalRepayment), zero)
      lot.remainingCostTotal = Decimal.max(lot.remainingCostTotal.minus(capitalRepayment), zero)
      lot.capitalRepaymentTotal = lot.capitalRepaymentTotal.add(capitalRepayment)
      lot.cashDistributionGrossTotal = lot.cashDistributionGrossTotal.add(gross)
      if (capitalRepayment.gt(0)) {
        lot.capitalRepaymentBreakdown.push({
          distributionDate: entry.date,
          shares: lot.amount,
          capitalRepaymentPerShare,
          capitalRepaymentTotal: capitalRepayment,
        })
      }
      return {
        subscriptionId: lot.id,
        subscriptionDate: lot.date,
        shares: lot.amount,
        gross,
        capitalRepayment,
        dividend,
        remainingCostPerShareAfter: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
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
      } satisfies CashDistributionSummary
    )
  }

  return summaries
}

function calculateSellSummary(
  sellableLots: WorkingLot[],
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

  let remainingSellAmount = sellAmount
  const usedSubscriptions: SellLotSummary[] = []
  for (const lot of sellableLots) {
    if (remainingSellAmount.lte(0)) break
    const soldAmount = Decimal.min(lot.amount, remainingSellAmount)
    if (soldAmount.lte(0)) continue

    const gross = soldAmount.mul(ipoSummary.ipoPricePerShare)
    const originalCostBasis = lot.amount.gt(0) ? lot.totalPrice.mul(soldAmount).div(lot.amount) : zero
    const realCostBasis = lot.amount.gt(0) ? lot.remainingCostTotal.mul(soldAmount).div(lot.amount) : zero
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

    usedSubscriptions.push({
      subscriptionId: lot.id,
      subscriptionDate: lot.date,
      totalSubscriptionShares: lot.amount,
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
    })

    remainingSellAmount = remainingSellAmount.minus(soldAmount)
  }

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
    amount: lot.amount,
    acquisitionCostExplanation: {
      originalAmount: lot.originalAmount,
      originalPricePerShare: lot.originalPricePerShare,
      originalOtherTotalAcquisitionCosts: lot.originalOtherTotalAcquisitionCosts,
      originalTotalPrice: lot.originalTotalPrice,
      adjustments: lot.acquisitionCostAdjustments,
    },
    totalPrice: lot.totalPrice,
    totalPricePerShare: lot.amount.gt(0) ? lot.totalPrice.div(lot.amount) : zero,
    cashDistributionGrossTotal: lot.cashDistributionGrossTotal,
    capitalRepaymentTotal: lot.capitalRepaymentTotal,
    capitalRepaymentBreakdown: lot.capitalRepaymentBreakdown,
    capitalRepaymentPerShare: lot.amount.gt(0) ? lot.capitalRepaymentTotal.div(lot.amount) : zero,
    remainingCostPerShare: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
    remainingCostTotal: lot.remainingCostTotal,
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

function buildTaxReturnYearSummaries(
  cashDistributions: CashDistributionSummary[],
  ipoDate: Date | undefined,
  sell: SellSummary
) {
  const yearSet = new Set<number>()
  cashDistributions.forEach((cashDistribution) => {
    const date = cashDistribution.date.match(/(\d{4})$/)?.[1]
    if (date) yearSet.add(Number(date))
  })
  const ipoYear = ipoDate?.getUTCFullYear()
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

    return {
      year,
      missingMathematicalValueWarningDates,
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
              grossSale: sell.grossTotal,
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
  const errors: string[] = []
  const warnings: string[] = []
  const baseLots = [...form.subscriptions]
    .sort((a, b) => compareDateStrings(a.date, b.date))
    .map((subscription) => createLot(subscription, errors, localization))
  const totalSubscribedCost = sumDecimals(baseLots.map((lot) => lot.totalPrice))
  const ipoDate = parseOptionalDateInput(form.ipo.ipoDate, localization.calculator.fields.ipoDate, errors, localization)
  const mathematicalShareValuesByYear = createMathematicalShareValuesByYear(
    form.mathematicalShareValues,
    errors,
    localization
  )
  const parsedCashDistributions = createParsedCashDistributions(form.cashDistributions, errors, localization)
  const parsedShareSplits = createParsedShareSplits(form.shareSplits, errors, localization)
  const parsedDemergers = createParsedDemergers(form.demergers, errors, localization)
  const splitAdjustedLots = cloneLots(baseLots)
  applyShareSplitsToLots(splitAdjustedLots, parsedShareSplits, ipoDate)
  const totalSubscribedShares = sumDecimals(splitAdjustedLots.map((lot) => lot.amount))
  const { sellAmount, otherAnnualCapitalGainsOrLosses, ipo } = parseIpoAndSellInputs(
    form,
    ipoDate,
    totalSubscribedShares,
    totalSubscribedCost,
    errors,
    warnings,
    localization
  )
  collectUnsupportedYearWarnings(form, ipoDate, sellAmount, warnings, localization, useYearlyRules)
  const ipoTimelineLots = cloneLots(baseLots)
  applyCashDistributions(
    ipoTimelineLots,
    parsedCashDistributions,
    parsedShareSplits,
    parsedDemergers,
    ipoDate,
    mathematicalShareValuesByYear,
    effectiveRules,
    warnings,
    localization,
    useYearlyRules,
    { stopAtIpoDate: true }
  )
  const vesting = calculateVestingSummary(ipoTimelineLots, ipoDate)
  const lots = cloneLots(baseLots)
  const cashDistributions = applyCashDistributions(
    lots,
    parsedCashDistributions,
    parsedShareSplits,
    parsedDemergers,
    ipoDate,
    mathematicalShareValuesByYear,
    effectiveRules,
    warnings,
    localization,
    useYearlyRules
  )
  const sell = calculateSellSummary(
    vesting.sellableLots,
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
    ipo,
    sell,
    taxReturns: {
      years: buildTaxReturnYearSummaries(cashDistributions, ipoDate, sell),
    },
  }
}
