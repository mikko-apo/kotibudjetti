import Decimal from 'decimal.js'
import { FI, type OsakkeetLocalization } from './osakkeetLocalizations'

export type ShareSubscriptionInput = {
  id: string
  date: string
  vestingEndsOn?: string
  amount: string
  totalPrice: string
  originalShareValue?: string
  pricePerShare?: string
}

export type CashDistributionInput = {
  id: string
  date: string
  type: 'capital_return' | 'dividend'
  amountPerShare: string
}

export type MathematicalShareValueInput = {
  id: string
  year: string
  valuePerShare: string
}

export type IpoDetailsInput = {
  ipoDate: string
  totalShareCount: string
  totalIpoCost: string
  currentShareValue: string
  estimatedPreIpoValue: string
  estimatedSecondaryShareSellPercentage: string
}

export type IpoSellDetailsInput = {
  amount: string
}

export type OsakkeetFormData = {
  subscriptions: ShareSubscriptionInput[]
  cashDistributions: CashDistributionInput[]
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
  totalPrice: Decimal
  remainingCostTotal: Decimal
  capitalRepaymentTotal: Decimal
  cashDistributionGrossTotal: Decimal
}

export type SubscriptionSummary = {
  id: string
  date: string
  amount: Decimal
  totalPrice: Decimal
  cashDistributionGrossTotal: Decimal
  capitalRepaymentPerShare: Decimal
  remainingCostPerShare: Decimal
  remainingCostTotal: Decimal
}

export type CashDistributionAllocation = {
  subscriptionId: string
  subscriptionDate: string
  shares: Decimal
  gross: Decimal
  capitalRepayment: Decimal
  dividend: Decimal
  remainingCostPerShareAfter: Decimal
  eligibleCapitalRepayment: boolean
}

export type CashDistributionSummary = {
  id: string
  date: string
  type: 'capital_return' | 'dividend'
  amountPerShare: Decimal
  sharesHeld: Decimal
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

export type SellLotSummary = {
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
    netAfterTaxAndIpoCost: Decimal
    remainingUnsoldShares: Decimal
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
}

export const OSAKKEET_TAX_RULES_2026: OsakkeetTaxRules = {
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
}

function decimalOrZero(value: string, field: string, errors: string[], localization: OsakkeetLocalization) {
  const normalized = value.trim()
  if (normalized === '') return zero
  try {
    const parsed = new Decimal(normalized)
    if (parsed.isNegative()) {
      errors.push(localization.calculator.validation.negative(field))
    }
    return parsed
  } catch {
    errors.push(localization.calculator.validation.invalidNumber(field))
    return zero
  }
}

function dateOrUndefined(value: string, field: string, errors: string[], localization: OsakkeetLocalization) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const date = parseSupportedDate(trimmed)
  if (!date || Number.isNaN(date.getTime())) {
    errors.push(localization.calculator.validation.invalidDate(field))
    return undefined
  }
  return date
}

function parseSupportedDate(trimmed: string) {
  const finnishDateMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

  if (finnishDateMatch) {
    const [, day, month, year] = finnishDateMatch
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }
  if (isoDateMatch) {
    return new Date(`${trimmed}T00:00:00Z`)
  }
  return undefined
}

function addYears(date: Date, years: number) {
  const next = new Date(date.getTime())
  next.setUTCFullYear(next.getUTCFullYear() + years)
  return next
}

function isWithinYearsInclusive(start?: Date, end?: Date, years = 10) {
  if (!start || !end) return false
  return end.getTime() <= addYears(start, years).getTime()
}

function isAtLeastYears(start?: Date, end?: Date, years = 10) {
  if (!start || !end) return false
  return end.getTime() >= addYears(start, years).getTime()
}

function createLot(input: ShareSubscriptionInput, errors: string[], localization: OsakkeetLocalization) {
  const amount = decimalOrZero(
    input.amount,
    localization.calculator.fields.subscriptionAmount(input.date || input.id),
    errors,
    localization
  )
  const totalPrice = decimalOrZero(
    input.totalPrice || input.pricePerShare || '',
    localization.calculator.fields.subscriptionTotalPrice(input.date || input.id),
    errors,
    localization
  )
  return {
    id: input.id,
    date: input.date,
    dateValue: dateOrUndefined(
      input.date,
      localization.calculator.fields.subscriptionDate(input.id),
      errors,
      localization
    ),
    vestingEndsOn: input.vestingEndsOn || '',
    vestingEndsOnValue: dateOrUndefined(
      input.vestingEndsOn || '',
      localization.calculator.fields.subscriptionVestingEndsOn(input.id),
      errors,
      localization
    ),
    amount,
    totalPrice,
    remainingCostTotal: totalPrice,
    capitalRepaymentTotal: zero,
    cashDistributionGrossTotal: zero,
  } satisfies WorkingLot
}

function compareDateStrings(a: string, b: string) {
  const dateA = parseSupportedDate(a.trim())
  const dateB = parseSupportedDate(b.trim())
  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime()
  }
  if (dateA) return -1
  if (dateB) return 1
  return a.localeCompare(b)
}

function sumDecimals(values: Decimal[]) {
  return values.reduce((acc, value) => acc.add(value), zero)
}

function estimateCapitalTax(taxableGain: Decimal, rules: OsakkeetTaxRules) {
  if (taxableGain.lte(0)) return zero
  const threshold = new Decimal(rules.capitalIncomeTax.threshold)
  const lowPart = Decimal.min(taxableGain, threshold)
  const highPart = Decimal.max(taxableGain.minus(threshold), zero)
  return lowPart.mul(rules.capitalIncomeTax.lowRate).add(highPart.mul(rules.capitalIncomeTax.highRate))
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
    const year = decimalOrZero(
      row.year,
      localization.calculator.fields.mathematicalShareValueYear(row.id),
      errors,
      localization
    )
    const valuePerShare = decimalOrZero(
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

function parseIpoAndSellInputs(
  form: OsakkeetFormData,
  totalSubscribedShares: Decimal,
  totalSubscribedCost: Decimal,
  errors: string[],
  warnings: string[],
  localization: OsakkeetLocalization
) {
  const ipoDate = dateOrUndefined(form.ipo.ipoDate, localization.calculator.fields.ipoDate, errors, localization)
  const totalShareCountInput = decimalOrZero(
    form.ipo.totalShareCount,
    localization.calculator.fields.totalShareCount,
    errors,
    localization
  )
  const totalShareCount = totalShareCountInput.gt(0) ? totalShareCountInput : totalSubscribedShares
  const totalIpoCost = decimalOrZero(
    form.ipo.totalIpoCost,
    localization.calculator.fields.totalIpoCost,
    errors,
    localization
  )
  const currentShareValue = decimalOrZero(
    form.ipo.currentShareValue,
    localization.calculator.fields.currentShareValue,
    errors,
    localization
  )
  const currentTotalValue = currentShareValue.mul(totalShareCount)
  const estimatedPreIpoValue = decimalOrZero(
    form.ipo.estimatedPreIpoValue,
    localization.calculator.fields.estimatedPreIpoValue,
    errors,
    localization
  )
  const estimatedSecondaryShareSellPercentage = decimalOrZero(
    form.ipo.estimatedSecondaryShareSellPercentage,
    localization.calculator.fields.estimatedSecondaryShareSellPercentage,
    errors,
    localization
  )
  const sellAmount = decimalOrZero(form.sell.amount, localization.calculator.fields.sellAmount, errors, localization)

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
  const sellableLots = lots.filter(
    (lot) => !lot.vestingEndsOnValue || !!(ipoDate && ipoDate.getTime() >= lot.vestingEndsOnValue.getTime())
  )
  const lockedLots = lots.filter(
    (lot) => !!lot.vestingEndsOnValue && (!ipoDate || ipoDate.getTime() < lot.vestingEndsOnValue.getTime())
  )
  return {
    sellableLots,
    lockedLots,
    totalShares: sumDecimals(lots.map((lot) => lot.amount)),
    vestedShares: sumDecimals(sellableLots.map((lot) => lot.amount)),
    unvestedShares: sumDecimals(lockedLots.map((lot) => lot.amount)),
  }
}

function applyCashDistributions(
  lots: WorkingLot[],
  entries: CashDistributionInput[],
  ipoDate: Date | undefined,
  mathematicalShareValuesByYear: Map<number, Decimal>,
  rules: OsakkeetTaxRules,
  errors: string[],
  warnings: string[],
  localization: OsakkeetLocalization
) {
  const capitalDividendUsedByYear = new Map<number, Decimal>()
  const grossDividendUsedByYear = new Map<number, Decimal>()
  return [...entries]
    .sort((a, b) => compareDateStrings(a.date, b.date))
    .map((entry) => {
      const cashDistributionDate = dateOrUndefined(
        entry.date,
        localization.calculator.fields.cashDistributionDate(entry.id),
        errors,
        localization
      )
      const amountPerShare = decimalOrZero(
        entry.amountPerShare,
        localization.calculator.fields.cashDistributionAmountPerShare(entry.id),
        errors,
        localization
      )
      const eligibleLots = lots.filter(
        (lot) => !lot.dateValue || !cashDistributionDate || lot.dateValue.getTime() <= cashDistributionDate.getTime()
      )
      const sharesHeld = sumDecimals(eligibleLots.map((lot) => lot.amount))
      const expectedTotal = amountPerShare.mul(sharesHeld)
      const grossTotal = expectedTotal
      const effectivePerShare = sharesHeld.gt(0) ? grossTotal.div(sharesHeld) : zero
      const isDividend = entry.type === 'dividend'

      if (sharesHeld.eq(0) && grossTotal.gt(0)) {
        warnings.push(localization.calculator.warnings.noSharesHeldForDistribution(entry.date))
      }

      const allocations = eligibleLots.map((lot) => {
        const gross = effectivePerShare.mul(lot.amount)
        const eligibleCapitalRepayment =
          !isDividend &&
          isWithinYearsInclusive(lot.dateValue, cashDistributionDate, rules.capitalRepayment.eligibilityYears) &&
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
      const year = cashDistributionDate?.getUTCFullYear()
      const mathematicalShareValuePerShare = year ? mathematicalShareValuesByYear.get(year) || zero : zero
      const shareholderMathematicalValue = mathematicalShareValuePerShare.mul(sharesHeld)
      const eightPercentYieldLimit = shareholderMathematicalValue.mul(rules.unlistedDividend.mathematicalValueYieldRate)

      const capitalDividendGross = shareholderMathematicalValue.gt(0)
        ? Decimal.min(dividendTotal, eightPercentYieldLimit)
        : zero
      const earnedDividendGross = shareholderMathematicalValue.gt(0)
        ? Decimal.max(dividendTotal.minus(capitalDividendGross), zero)
        : zero
      const usedCapitalDividend = year ? capitalDividendUsedByYear.get(year) || zero : zero
      const lowerCapitalDividendRoom = Decimal.max(
        new Decimal(rules.unlistedDividend.annualCapitalDividendThreshold).minus(usedCapitalDividend),
        zero
      )
      const lowCapitalPart = Decimal.min(capitalDividendGross, lowerCapitalDividendRoom)
      const highCapitalPart = Decimal.max(capitalDividendGross.minus(lowCapitalPart), zero)
      const taxableCapitalIncome = lowCapitalPart
        .mul(rules.unlistedDividend.lowCapitalDividendTaxableRate)
        .add(highCapitalPart.mul(rules.unlistedDividend.highCapitalDividendTaxableRate))
      const taxFreeCapitalIncomePortion = lowCapitalPart
        .mul(rules.unlistedDividend.lowCapitalDividendTaxFreeRate)
        .add(highCapitalPart.mul(rules.unlistedDividend.highCapitalDividendTaxFreeRate))
      const taxableEarnedDividend = earnedDividendGross.mul(rules.unlistedDividend.earnedDividendTaxableRate)
      const taxFreeEarnedDividend = earnedDividendGross.mul(rules.unlistedDividend.earnedDividendTaxFreeRate)

      const usedGrossDividend = year ? grossDividendUsedByYear.get(year) || zero : zero
      const lowerGrossDividendRoom = Decimal.max(
        new Decimal(rules.unlistedDividend.withholdingThreshold).minus(usedGrossDividend),
        zero
      )
      const lowWithholdingPart = Decimal.min(dividendTotal, lowerGrossDividendRoom)
      const highWithholdingPart = Decimal.max(dividendTotal.minus(lowWithholdingPart), zero)
      const withholdingToTaxOffice = lowWithholdingPart
        .mul(rules.unlistedDividend.lowWithholdingRate)
        .add(highWithholdingPart.mul(rules.unlistedDividend.highWithholdingRate))
      const paidInCash = grossTotal.minus(withholdingToTaxOffice)

      if (year) {
        capitalDividendUsedByYear.set(year, usedCapitalDividend.add(capitalDividendGross))
        grossDividendUsedByYear.set(year, usedGrossDividend.add(dividendTotal))
      }

      return {
        id: entry.id,
        date: entry.date,
        type: entry.type,
        amountPerShare,
        sharesHeld,
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
        treatedAsListedDividend:
          isDividend && !!(ipoDate && cashDistributionDate && cashDistributionDate.getTime() >= ipoDate.getTime()),
        allocations,
      } satisfies CashDistributionSummary
    })
}

function calculateSellSummary(
  sellableLots: WorkingLot[],
  sellAmount: Decimal,
  vestingSummary: VestingSummary,
  ipoSummary: IpoSummary,
  rules: OsakkeetTaxRules,
  errors: string[],
  warnings: string[],
  localization: OsakkeetLocalization
): SellSummary {
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
      rules.hankintamenoOlettama.ownershipYearsThreshold
    )
      ? new Decimal(rules.hankintamenoOlettama.longOwnershipRate)
      : new Decimal(rules.hankintamenoOlettama.shortOwnershipRate)
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
  const capitalIncomeThreshold = new Decimal(rules.capitalIncomeTax.threshold)
  const taxableGainAtLowRate = Decimal.max(Decimal.min(taxableGainTotal, capitalIncomeThreshold), zero)
  const taxableGainAtHighRate = Decimal.max(taxableGainTotal.minus(capitalIncomeThreshold), zero)
  const estimatedTax = estimateCapitalTax(taxableGainTotal, rules)
  const grossTotal = sumDecimals(usedSubscriptions.map((lot) => lot.gross))
  const selectedActualDeductionTotal = sumDecimals(
    usedSubscriptions.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.actualDeduction)
  )
  const shortOwnershipRate = new Decimal(rules.hankintamenoOlettama.shortOwnershipRate)
  const longOwnershipRate = new Decimal(rules.hankintamenoOlettama.longOwnershipRate)
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
    rules
  ).minus(
    estimatedTax
  )
  const netAfterTaxAndIpoCost = grossTotal.minus(totalIpoCostAllocated).minus(estimatedTax)

  return {
    amount: sellAmount,
    usedSubscriptions,
    grossTotal,
    cashAfterIpoCosts,
    taxFreeAcquisitionRecoveryAfterIpoCosts,
    soldShareOriginalCostTotal,
    soldShareAcquisitionCostTotal,
    selectedActualDeductionTotal,
    selectedHmo20DeductionTotal,
    selectedHmo40DeductionTotal,
    selectedDeductionTotal,
    totalIpoCostAllocated,
    ipoCostDeductedViaActual,
    ipoCostPaidWithoutActualDeduction,
    taxSavedFromDeductibleIpoCosts,
    taxableGainTotal,
    taxableGainAtLowRate,
    taxableGainAtHighRate,
    estimatedTax,
    netAfterTaxAndIpoCost,
    remainingUnsoldShares: Decimal.max(ipoSummary.totalSubscribedShares.minus(soldSharesTotal), zero),
  }
}

function buildSubscriptionSummaries(lots: WorkingLot[]): SubscriptionSummary[] {
  return lots.map((lot) => ({
    id: lot.id,
    date: lot.date,
    amount: lot.amount,
    totalPrice: lot.totalPrice,
    cashDistributionGrossTotal: lot.cashDistributionGrossTotal,
    capitalRepaymentPerShare: lot.amount.gt(0) ? lot.capitalRepaymentTotal.div(lot.amount) : zero,
    remainingCostPerShare: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
    remainingCostTotal: lot.remainingCostTotal,
  }))
}

export function calculateOsakkeet(
  form: OsakkeetFormData,
  localization: OsakkeetLocalization = FI,
  rules: OsakkeetTaxRules = OSAKKEET_TAX_RULES_2026
): OsakkeetCalculation {
  const errors: string[] = []
  const warnings: string[] = []
  const lots = [...form.subscriptions]
    .sort((a, b) => compareDateStrings(a.date, b.date))
    .map((subscription) => createLot(subscription, errors, localization))
  const totalSubscribedShares = sumDecimals(lots.map((lot) => lot.amount))
  const totalSubscribedCost = sumDecimals(lots.map((lot) => lot.totalPrice))
  const mathematicalShareValuesByYear = createMathematicalShareValuesByYear(
    form.mathematicalShareValues,
    errors,
    localization
  )
  const { ipoDate, sellAmount, ipo } = parseIpoAndSellInputs(
    form,
    totalSubscribedShares,
    totalSubscribedCost,
    errors,
    warnings,
    localization
  )
  const vesting = calculateVestingSummary(lots, ipoDate)
  const cashDistributions = applyCashDistributions(
    lots,
    form.cashDistributions,
    ipoDate,
    mathematicalShareValuesByYear,
    rules,
    errors,
    warnings,
    localization
  )
  const sell = calculateSellSummary(
    vesting.sellableLots,
    sellAmount,
    vesting,
    ipo,
    rules,
    errors,
    warnings,
    localization
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
  }
}
