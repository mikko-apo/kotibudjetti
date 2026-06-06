import Decimal from 'decimal.js'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import type {
  CashDistributionInput,
  DemergerInput,
  OsakkeetFormData,
  ShareSellInput,
  ShareSplitInput,
  ShareSubscriptionInput,
} from './osakkeetTypes'
import type { ShareCalculatorLogEntry } from './shareCalculatorTypes'
import { parseSupportedDate, parseSupportedTimestampOrDate } from './osakkeetUtils'

const zero = new Decimal(0)

type ParseValidationMessages = {
  negative: (field: string) => string
  invalidNumber: (field: string) => string
  invalidDate: (field: string) => string
}

type DecimalParseOptions = {
  allowNegative?: boolean
  validate?: (value: Decimal) => boolean
}

export type ParsedEventTimestamp = {
  date: string
  timestampMs: number
  calendarDayKey: string
  dayKey?: string
}

export type ParsedSubscription = {
  kind: 'subscription'
  id: string
  date: string
  parsedTimestamp?: ParsedEventTimestamp
  dateValue?: Date
  vestingEndsOn: string
  vestingEndsOnValue?: Date
  shareCount: Decimal
  shareAcquisitionCost: Decimal
  originalSharePrice: Decimal
  originalOtherTotalAcquisitionCosts: Decimal
}

export type CapitalRepaymentBreakdown = {
  distributionDate: string
  shares: Decimal
  capitalRepaymentPerShare: Decimal
  capitalRepaymentTotal: Decimal
}

export type CapitalRepaymentHoverEntry = {
  distributionDate: string
  shares: Decimal
  inputAmountPerShare: Decimal
  appliedCapitalRepaymentPerShare: Decimal
  appliedCapitalRepaymentTotal: Decimal
  directedToDividendPerShare: Decimal
  directedToDividendTotal: Decimal
  dividendReason?: 'too_old' | 'no_remaining_cost' | 'listed_dividend' | 'remaining_cost_limit'
}

export type AcquisitionCostAdjustment =
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

export type WorkingLot = ParsedSubscription & {
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

type ParsedSell = {
  kind: 'sell'
  id: string
  date: string
  parsedTimestamp?: ParsedEventTimestamp
  shareCount: Decimal
  sellPrice: Decimal
  pricePerShare: Decimal
  otherTotalSellCosts: Decimal
}

type ParsedShareCountChange = {
  kind: 'shareCountChange'
  id: string
  date: string
  parsedTimestamp?: ParsedEventTimestamp
  shareCountMultiplier: Decimal
}

type ParsedAcquisitionCostChange = {
  kind: 'acquisitionCostChange'
  id: string
  date: string
  parsedTimestamp?: ParsedEventTimestamp
  shareAcquisitionCostMultiplier: Decimal
}

export type ParsedCapitalRepaymentOrDividend = {
  kind: 'capitalRepaymentOrDividend'
  id: string
  date: string
  parsedTimestamp?: ParsedEventTimestamp
  dateValue?: Date
  type: 'capital_return' | 'dividend'
  amountPerShare: Decimal
}

export type ParsedEvent =
  | ParsedSubscription
  | ParsedSell
  | ParsedShareCountChange
  | ParsedAcquisitionCostChange
  | ParsedCapitalRepaymentOrDividend

export type ParsedIpoInputs = {
  totalShareCountInput: Decimal
  totalIpoCost: Decimal
  currentShareValue: Decimal
  estimatedPreIpoValue: Decimal
  estimatedSecondaryShareSellPercentage: Decimal
}

export type ParsedCompanyInputs = {
  listingStatus: 'unlisted' | 'listed'
  becameListedDateText: string
  becameListedDate?: Date
}

export type ParsedIpoSellInputs = {
  amount: Decimal
  pricePerShare: Decimal
  costPerShare: Decimal
  otherAnnualCapitalGainsOrLosses: Decimal
}

export type ParsedShareCalculatorInputs = {
  subscriptions: ParsedSubscription[]
  sells: ParsedSell[]
  shareSplits: ParsedShareCountChange[]
  demergers: ParsedAcquisitionCostChange[]
  cashDistributions: ParsedCapitalRepaymentOrDividend[]
}

export type ParsedOsakkeetCalculatorInputs = ParsedShareCalculatorInputs & {
  company: ParsedCompanyInputs
  mathematicalShareValuesByYear: Map<number, Decimal>
}

export type ParsedOsakkeetIpoCalculatorInputs = {
  ipo: ParsedIpoInputs
  ipoSell: ParsedIpoSellInputs
}

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function parseEventTimestamp(date: string): ParsedEventTimestamp | undefined {
  const parsed = parseSupportedTimestampOrDate(date.trim())
  if (!parsed || Number.isNaN(parsed.getTime())) return undefined
  const trimmed = date.trim()
  const isDateOnly = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(trimmed) || /^(\d{4})-(\d{2})-(\d{2})$/.test(trimmed)
  const isMidnightUtc =
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0

  return {
    date: trimmed,
    timestampMs: parsed.getTime(),
    calendarDayKey: toDayKey(parsed),
    dayKey: isDateOnly || isMidnightUtc ? toDayKey(parsed) : undefined,
  }
}

export function hasParsedTimestamp<T extends { parsedTimestamp?: ParsedEventTimestamp }>(
  event: T
): event is T & { parsedTimestamp: ParsedEventTimestamp } {
  return !!event.parsedTimestamp
}

function parseDecimalInput(
  value: string,
  field: string,
  errors: string[],
  validation: ParseValidationMessages,
  options: DecimalParseOptions = {}
) {
  const normalized = value.trim()
  if (normalized === '') return zero
  try {
    const parsed = new Decimal(normalized)
    if (!options.allowNegative && parsed.isNegative()) {
      errors.push(validation.negative(field))
    }
    if (options.validate && !options.validate(parsed)) {
      errors.push(validation.invalidNumber(field))
    }
    return parsed
  } catch {
    errors.push(validation.invalidNumber(field))
    return zero
  }
}

function parseOptionalDateInput(value: string, field: string, errors: string[], validation: ParseValidationMessages) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const date = parseSupportedDate(trimmed)
  if (!date || Number.isNaN(date.getTime())) {
    errors.push(validation.invalidDate(field))
    return undefined
  }
  return date
}

function parseSubscriptionAcquisitionCost(
  input: ShareSubscriptionInput,
  errors: string[],
  validation: ParseValidationMessages,
  fieldLabels: {
    amount: string
    pricePerShare: string
    otherTotalAcquisitionCosts: string
    totalPrice: string
  }
) {
  const shareCount = parseDecimalInput(input.amount, fieldLabels.amount, errors, validation, {
    validate: (value) => value.gt(0),
  })
  const pricePerShare = parseDecimalInput(input.pricePerShare || '', fieldLabels.pricePerShare, errors, validation)
  const otherTotalAcquisitionCosts = parseDecimalInput(
    input.otherTotalAcquisitionCosts || '',
    fieldLabels.otherTotalAcquisitionCosts,
    errors,
    validation
  )
  const fallbackTotalPrice = parseDecimalInput(input.totalPrice || '', fieldLabels.totalPrice, errors, validation)
  const totalPrice = shareCount.mul(pricePerShare).add(otherTotalAcquisitionCosts)
  const effectiveTotalPrice =
    totalPrice.gt(0) || input.pricePerShare || input.otherTotalAcquisitionCosts ? totalPrice : fallbackTotalPrice

  return {
    shareCount,
    shareAcquisitionCost: effectiveTotalPrice,
    originalSharePrice: pricePerShare,
    originalOtherTotalAcquisitionCosts: otherTotalAcquisitionCosts,
  }
}

function createEnglishValidationMessages(): ParseValidationMessages {
  return {
    negative: (field) => `${field} cannot be negative.`,
    invalidNumber: (field) => `${field} is not a valid number.`,
    invalidDate: (field) => `${field} is not a valid date.`,
  }
}

export function parseShareCalculatorInputs(
  inputs: {
    subscriptions: ShareSubscriptionInput[]
    sells: ShareSellInput[]
    shareSplits: ShareSplitInput[]
    demergers: DemergerInput[]
    cashDistributions?: CashDistributionInput[]
  },
  errors: string[]
): ParsedShareCalculatorInputs {
  const validation = createEnglishValidationMessages()

  return {
    subscriptions: inputs.subscriptions.map((input) => {
      const parsedTimestamp = parseEventTimestamp(input.date)
      if (!parsedTimestamp) errors.push(`Subscription ${input.id} date is not valid.`)
      const parsedValues = parseSubscriptionAcquisitionCost(input, errors, validation, {
        amount: `Subscription ${input.id} amount`,
        pricePerShare: `Subscription ${input.id} pricePerShare`,
        otherTotalAcquisitionCosts: `Subscription ${input.id} otherTotalAcquisitionCosts`,
        totalPrice: `Subscription ${input.id} totalPrice`,
      })
      return {
        kind: 'subscription' as const,
        id: input.id,
        date: input.date,
        parsedTimestamp,
        shareCount: parsedValues.shareCount,
        shareAcquisitionCost: parsedValues.shareAcquisitionCost,
        originalSharePrice: parsedValues.originalSharePrice,
        originalOtherTotalAcquisitionCosts: parsedValues.originalOtherTotalAcquisitionCosts,
        vestingEndsOn: input.vestingEndsOn || '',
      }
    }),
    sells: inputs.sells.map((input) => {
      const parsedTimestamp = parseEventTimestamp(input.date)
      if (!parsedTimestamp) errors.push(`Sell ${input.id} date is not valid.`)
      const shareCount = parseDecimalInput(input.shareCount, `Sell ${input.id} shareCount`, errors, validation, {
        validate: (value) => value.gt(0),
      })
      const pricePerShareInput = parseDecimalInput(
        input.pricePerShare || '',
        `Sell ${input.id} pricePerShare`,
        input.pricePerShare ? errors : [],
        validation,
        { validate: (value) => value.gt(0) }
      )
      const sellPriceInput = parseDecimalInput(
        input.sellPrice || '',
        `Sell ${input.id} sellPrice`,
        input.sellPrice ? errors : [],
        validation,
        { validate: (value) => value.gt(0) }
      )
      const hasSellPrice = (input.sellPrice || '').trim() !== ''
      const hasPricePerShare = (input.pricePerShare || '').trim() !== ''
      if (!hasSellPrice && !hasPricePerShare) {
        errors.push(`Sell ${input.id} sellPrice or pricePerShare must be provided.`)
      }
      const sellPrice = hasSellPrice ? sellPriceInput : hasPricePerShare ? shareCount.mul(pricePerShareInput) : zero
      const pricePerShare = shareCount.gt(0) ? sellPrice.div(shareCount) : pricePerShareInput
      const otherTotalSellCosts = parseDecimalInput(
        input.otherTotalSellCosts || '',
        `Sell ${input.id} otherTotalSellCosts`,
        input.otherTotalSellCosts ? errors : [],
        validation,
        { validate: (value) => value.gte(0) }
      )
      return {
        kind: 'sell' as const,
        id: input.id,
        date: input.date,
        parsedTimestamp,
        shareCount,
        sellPrice,
        pricePerShare,
        otherTotalSellCosts,
      }
    }),
    shareSplits: inputs.shareSplits.map((input) => {
      const parsedTimestamp = parseEventTimestamp(input.date)
      if (!parsedTimestamp) errors.push(`Share split ${input.id} date is not valid.`)
      return {
        kind: 'shareCountChange' as const,
        id: input.id,
        date: input.date,
        parsedTimestamp,
        shareCountMultiplier: parseDecimalInput(
          input.multiplier,
          `Share split ${input.id} multiplier`,
          errors,
          validation,
          { validate: (value) => value.gt(0) }
        ),
      }
    }),
    demergers: inputs.demergers.map((input) => {
      const parsedTimestamp = parseEventTimestamp(input.date)
      if (!parsedTimestamp) errors.push(`Demerger ${input.id} date is not valid.`)
      return {
        kind: 'acquisitionCostChange' as const,
        id: input.id,
        date: input.date,
        parsedTimestamp,
        shareAcquisitionCostMultiplier: parseDecimalInput(
          input.oldCompanyRatio,
          `Demerger ${input.id} oldCompanyRatio`,
          errors,
          validation,
          { validate: (value) => value.gt(0) && value.lte(1) }
        ),
      }
    }),
    cashDistributions: (inputs.cashDistributions || []).map((input) => {
      const parsedTimestamp = parseEventTimestamp(input.date)
      if (!parsedTimestamp) errors.push(`Cash distribution ${input.id} date is not valid.`)
      return {
        kind: 'capitalRepaymentOrDividend' as const,
        id: input.id,
        date: input.date,
        parsedTimestamp,
        type: input.type,
        amountPerShare: parseDecimalInput(
          input.amountPerShare,
          `Cash distribution ${input.id} amountPerShare`,
          errors,
          validation
        ),
      }
    }),
  }
}

export function parseOsakkeetCalculatorInputs(
  form: OsakkeetFormData,
  localization: OsakkeetLocalization
): { parsed: ParsedOsakkeetCalculatorInputs; errors: string[] } {
  const errors: string[] = []
  const validation = localization.calculator.validation
  const sellFieldLabel = (id: string, field: string) => `Osakkeiden myynti ${id} ${field}`
  const company = {
    listingStatus: form.company.listingStatus === 'listed' ? 'listed' : 'unlisted',
    becameListedDateText: form.company.becameListedDate,
    becameListedDate: parseOptionalDateInput(
      form.company.becameListedDate,
      localization.calculator.fields.becameListedDate,
      errors,
      validation
    ),
  } satisfies ParsedCompanyInputs
  const subscriptions = form.subscriptions.map((input) => {
    const fieldLabel = input.date || input.id
    return {
      kind: 'subscription' as const,
      id: input.id,
      date: input.date,
      parsedTimestamp: parseEventTimestamp(input.date),
      dateValue: parseOptionalDateInput(
        input.date,
        localization.calculator.fields.subscriptionDate(input.id),
        errors,
        validation
      ),
      vestingEndsOn: input.vestingEndsOn || '',
      vestingEndsOnValue: parseOptionalDateInput(
        input.vestingEndsOn || '',
        localization.calculator.fields.subscriptionVestingEndsOn(input.id),
        errors,
        validation
      ),
      ...parseSubscriptionAcquisitionCost(input, errors, validation, {
        amount: localization.calculator.fields.subscriptionAmount(fieldLabel),
        pricePerShare: localization.calculator.fields.subscriptionPricePerShare(fieldLabel),
        otherTotalAcquisitionCosts: localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(fieldLabel),
        totalPrice: localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(fieldLabel),
      }),
    }
  })

  const sells = form.sells.map((input) => {
    const parsedTimestamp = parseEventTimestamp(input.date)
    const shareCount = parseDecimalInput(input.shareCount, sellFieldLabel(input.id, 'määrä'), errors, validation, {
      validate: (value) => value.gt(0),
    })
    const pricePerShareInput = parseDecimalInput(
      input.pricePerShare || '',
      sellFieldLabel(input.id, 'hinta/osake'),
      input.pricePerShare ? errors : [],
      validation,
      { validate: (value) => value.gt(0) }
    )
    const sellPriceInput = parseDecimalInput(
      input.sellPrice || '',
      sellFieldLabel(input.id, 'myyntihinta'),
      input.sellPrice ? errors : [],
      validation,
      { validate: (value) => value.gt(0) }
    )
    const hasSellPrice = (input.sellPrice || '').trim() !== ''
    const hasPricePerShare = (input.pricePerShare || '').trim() !== ''
    if (!parsedTimestamp) {
      errors.push(validation.invalidDate(sellFieldLabel(input.id, 'päivä')))
    }
    if (!hasSellPrice && !hasPricePerShare) {
      errors.push(validation.invalidNumber(sellFieldLabel(input.id, 'hinta/osake tai myyntihinta')))
    }
    const sellPrice = hasSellPrice ? sellPriceInput : hasPricePerShare ? shareCount.mul(pricePerShareInput) : zero
    const pricePerShare = shareCount.gt(0) ? sellPrice.div(shareCount) : pricePerShareInput
    const otherTotalSellCosts = parseDecimalInput(
      input.otherTotalSellCosts || '',
      sellFieldLabel(input.id, 'muut kulut'),
      input.otherTotalSellCosts ? errors : [],
      validation,
      { validate: (value) => value.gte(0) }
    )
    return {
      kind: 'sell' as const,
      id: input.id,
      date: input.date,
      parsedTimestamp,
      shareCount,
      sellPrice,
      pricePerShare,
      otherTotalSellCosts,
    }
  })

  const shareSplits = form.shareSplits.map((input) => {
    const parsedTimestamp = parseEventTimestamp(input.date)
    if (!parsedTimestamp) {
      errors.push(validation.invalidDate(localization.calculator.fields.shareSplitDate(input.id)))
    }
    return {
      kind: 'shareCountChange' as const,
      id: input.id,
      date: input.date,
      parsedTimestamp,
      shareCountMultiplier: parseDecimalInput(
        input.multiplier,
        localization.calculator.fields.shareSplitMultiplier(input.id),
        errors,
        validation,
        { validate: (value) => value.gt(0) }
      ),
    }
  })

  const demergers = form.demergers.map((input) => {
    const parsedTimestamp = parseEventTimestamp(input.date)
    if (!parsedTimestamp) {
      errors.push(validation.invalidDate(localization.calculator.fields.demergerDate(input.id)))
    }
    return {
      kind: 'acquisitionCostChange' as const,
      id: input.id,
      date: input.date,
      parsedTimestamp,
      shareAcquisitionCostMultiplier: parseDecimalInput(
        input.oldCompanyRatio,
        localization.calculator.fields.demergerOldCompanyRatio(input.id),
        errors,
        validation,
        { validate: (value) => value.gt(0) && value.lte(1) }
      ),
    }
  })

  const cashDistributions = form.cashDistributions.map((row) => ({
    kind: 'capitalRepaymentOrDividend' as const,
    id: row.id,
    date: row.date,
    parsedTimestamp: parseEventTimestamp(row.date),
    dateValue: parseOptionalDateInput(
      row.date,
      localization.calculator.fields.cashDistributionDate(row.id),
      errors,
      validation
    ),
    type: row.type,
    amountPerShare: parseDecimalInput(
      row.amountPerShare,
      localization.calculator.fields.cashDistributionAmountPerShare(row.id),
      errors,
      validation
    ),
  }))

  const mathematicalShareValuesByYear = new Map<number, Decimal>()
  form.mathematicalShareValues.forEach((row) => {
    const year = parseDecimalInput(
      row.year,
      localization.calculator.fields.mathematicalShareValueYear(row.id),
      errors,
      validation
    )
    const valuePerShare = parseDecimalInput(
      row.valuePerShare,
      localization.calculator.fields.mathematicalShareValuePerShare(row.id),
      errors,
      validation
    )
    if (year.gt(0)) mathematicalShareValuesByYear.set(year.toNumber(), valuePerShare)
  })

  const parsed = {
    company,
    subscriptions,
    sells,
    shareSplits,
    demergers,
    cashDistributions,
    mathematicalShareValuesByYear,
  } satisfies ParsedOsakkeetCalculatorInputs

  return { parsed, errors }
}

export function parseOsakkeetIpoCalculatorInputs(
  form: OsakkeetFormData,
  localization: OsakkeetLocalization
): { parsed: ParsedOsakkeetIpoCalculatorInputs; errors: string[] } {
  const errors: string[] = []
  const validation = localization.calculator.validation

  return {
    parsed: {
      ipo: {
        totalShareCountInput: parseDecimalInput(
          form.ipo.totalShareCount,
          localization.calculator.fields.totalShareCount,
          errors,
          validation
        ),
        totalIpoCost: parseDecimalInput(
          form.ipo.totalIpoCost,
          localization.calculator.fields.totalIpoCost,
          errors,
          validation
        ),
        currentShareValue: parseDecimalInput(
          form.ipo.currentShareValue,
          localization.calculator.fields.currentShareValue,
          errors,
          validation
        ),
        estimatedPreIpoValue: parseDecimalInput(
          form.ipo.estimatedPreIpoValue,
          localization.calculator.fields.estimatedPreIpoValue,
          errors,
          validation
        ),
        estimatedSecondaryShareSellPercentage: parseDecimalInput(
          form.ipo.estimatedSecondaryShareSellPercentage,
          localization.calculator.fields.estimatedSecondaryShareSellPercentage,
          errors,
          validation
        ),
      },
      ipoSell: {
        amount: parseDecimalInput(
          form.ipoSell.amount,
          localization.calculator.fields.ipoSellAmount,
          errors,
          validation
        ),
        pricePerShare: parseDecimalInput(
          form.ipoSell.pricePerShare || '',
          localization.calculator.fields.ipoSellPricePerShare,
          form.ipoSell.pricePerShare ? errors : [],
          validation
        ),
        costPerShare: parseDecimalInput(
          form.ipoSell.costPerShare || '',
          localization.calculator.fields.ipoSellCostPerShare,
          form.ipoSell.costPerShare ? errors : [],
          validation
        ),
        otherAnnualCapitalGainsOrLosses: parseDecimalInput(
          form.ipoSell.otherAnnualCapitalGainsOrLosses || '',
          localization.calculator.fields.otherAnnualCapitalGainsOrLosses,
          errors,
          validation,
          { allowNegative: true }
        ),
      },
    },
    errors,
  }
}
