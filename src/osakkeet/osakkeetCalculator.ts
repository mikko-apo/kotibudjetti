import Decimal from 'decimal.js'

export type ShareSubscriptionInput = {
  id: string
  date: string
  amount: string
  totalPrice: string
  originalShareValue?: string
  pricePerShare?: string
}

export type ShareReimbursementInput = {
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
  reimbursements: ShareReimbursementInput[]
  mathematicalShareValues: MathematicalShareValueInput[]
  ipo: IpoDetailsInput
  sell: IpoSellDetailsInput
}

type WorkingLot = {
  id: string
  date: string
  dateValue?: Date
  amount: Decimal
  totalPrice: Decimal
  remainingCostTotal: Decimal
  capitalRepaymentTotal: Decimal
  reimbursementGrossTotal: Decimal
}

export type SubscriptionSummary = {
  id: string
  date: string
  amount: Decimal
  totalPrice: Decimal
  reimbursementGrossTotal: Decimal
  capitalRepaymentPerShare: Decimal
  remainingCostPerShare: Decimal
  remainingCostTotal: Decimal
}

export type ReimbursementAllocation = {
  subscriptionId: string
  subscriptionDate: string
  shares: Decimal
  gross: Decimal
  capitalRepayment: Decimal
  dividend: Decimal
  remainingCostPerShareAfter: Decimal
  eligibleCapitalRepayment: boolean
}

export type ReimbursementSummary = {
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
  allocations: ReimbursementAllocation[]
}

export type SellLotSummary = {
  subscriptionId: string
  subscriptionDate: string
  totalSubscriptionShares: Decimal
  soldAmount: Decimal
  gross: Decimal
  realCostBasis: Decimal
  allocatedIpoCost: Decimal
  actualDeduction: Decimal
  hankintamenoOlettaRate: Decimal
  hankintamenoOlettaDeduction: Decimal
  selectedMethod: string
  selectedDeduction: Decimal
  taxableGain: Decimal
  taxFreeGainPart: Decimal
  taxedGainPart: Decimal
}

export type OsakkeetCalculation = {
  warnings: string[]
  errors: string[]
  subscriptions: SubscriptionSummary[]
  reimbursements: ReimbursementSummary[]
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
    totalIpoCostAllocated: Decimal
    taxableGainTotal: Decimal
    estimatedTax: Decimal
    netAfterTaxAndIpoCost: Decimal
    remainingUnsoldShares: Decimal
  }
}

const zero = new Decimal(0)
const capitalIncomeThreshold = new Decimal(30000)
const lowCapitalTaxRate = new Decimal(0.3)
const highCapitalTaxRate = new Decimal(0.34)

function decimalOrZero(value: string, field: string, errors: string[]) {
  const normalized = value.trim()
  if (normalized === '') return zero
  try {
    const parsed = new Decimal(normalized)
    if (parsed.isNegative()) {
      errors.push(`${field} ei voi olla negatiivinen.`)
    }
    return parsed
  } catch {
    errors.push(`${field} ei ole kelvollinen numero.`)
    return zero
  }
}

function dateOrUndefined(value: string, field: string, errors: string[]) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const date = parseSupportedDate(trimmed)
  if (!date) {
    errors.push(`${field} ei ole kelvollinen pvm.`)
    return undefined
  }

  if (Number.isNaN(date.getTime())) {
    errors.push(`${field} ei ole kelvollinen pvm.`)
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

function createLot(input: ShareSubscriptionInput, errors: string[]) {
  const amount = decimalOrZero(input.amount, `Merkintä ${input.date || input.id} määrä`, errors)
  const totalPrice = decimalOrZero(
    input.totalPrice || input.pricePerShare || '',
    `Merkintä ${input.date || input.id} kokonaishinta`,
    errors
  )
  return {
    id: input.id,
    date: input.date,
    dateValue: dateOrUndefined(input.date, `Merkintä ${input.id} päivä`, errors),
    amount,
    totalPrice,
    remainingCostTotal: totalPrice,
    capitalRepaymentTotal: zero,
    reimbursementGrossTotal: zero,
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

function estimateCapitalTax(taxableGain: Decimal) {
  if (taxableGain.lte(0)) return zero
  const lowPart = Decimal.min(taxableGain, capitalIncomeThreshold)
  const highPart = Decimal.max(taxableGain.minus(capitalIncomeThreshold), zero)
  return lowPart.mul(lowCapitalTaxRate).add(highPart.mul(highCapitalTaxRate))
}

export function calculateOsakkeet(form: OsakkeetFormData): OsakkeetCalculation {
  const errors: string[] = []
  const warnings: string[] = []

  const ipoDate = dateOrUndefined(form.ipo.ipoDate, 'IPO-päivä', errors)
  const lots = [...form.subscriptions]
    .sort((a, b) => compareDateStrings(a.date, b.date))
    .map((subscription) => createLot(subscription, errors))

  const totalSubscribedShares = sumDecimals(lots.map((lot) => lot.amount))
  const totalSubscribedCost = sumDecimals(lots.map((lot) => lot.totalPrice))
  const mathematicalShareValuesByYear = new Map<number, Decimal>()
  for (const row of form.mathematicalShareValues) {
    const year = decimalOrZero(row.year, `Matemaattinen arvo vuosi ${row.id}`, errors)
    const valuePerShare = decimalOrZero(row.valuePerShare, `Matemaattinen arvo/osake ${row.id}`, errors)
    if (year.gt(0)) {
      mathematicalShareValuesByYear.set(year.toNumber(), valuePerShare)
    }
  }

  const totalShareCountInput = decimalOrZero(form.ipo.totalShareCount, 'Osakkeiden kokonaismäärä', errors)
  const totalShareCount = totalShareCountInput.gt(0) ? totalShareCountInput : totalSubscribedShares
  const totalIpoCost = decimalOrZero(form.ipo.totalIpoCost, 'IPO-kulut yhteensä', errors)
  const currentShareValue = decimalOrZero(form.ipo.currentShareValue, 'Nykyinen osakkeen arvo', errors)
  const currentTotalValue = currentShareValue.mul(totalShareCount)
  const estimatedPreIpoValue = decimalOrZero(form.ipo.estimatedPreIpoValue, 'Arvioitu pre-IPO-arvo', errors)
  const estimatedSecondaryShareSellPercentage = decimalOrZero(
    form.ipo.estimatedSecondaryShareSellPercentage,
    'Arvioitu secondary-myyntiprosentti',
    errors
  )
  const sellAmount = decimalOrZero(form.sell.amount, 'Myytävien osakkeiden määrä', errors)

  if (totalShareCountInput.gt(0) && totalShareCountInput.lt(totalSubscribedShares)) {
    warnings.push('Osakkeiden kokonaismäärä on pienempi kuin syötettyjen merkintöjen yhteismäärä.')
  }

  const estimatedSecondaryShareCount = totalShareCount.mul(estimatedSecondaryShareSellPercentage).div(100)
  const ipoPricePerShare = totalShareCount.gt(0) ? estimatedPreIpoValue.div(totalShareCount) : zero
  const currentValuePerShare = totalShareCount.gt(0) ? currentTotalValue.div(totalShareCount) : zero
  const increaseMultiplier = ipoPricePerShare.gt(0) ? currentValuePerShare.div(ipoPricePerShare) : zero
  const increasePercentage = estimatedPreIpoValue.gt(0) ? currentTotalValue.div(estimatedPreIpoValue).mul(100) : zero
  const ipoCostPerShare = estimatedSecondaryShareCount.gt(0)
    ? totalIpoCost.div(estimatedSecondaryShareCount)
    : totalShareCount.gt(0)
      ? totalIpoCost.div(totalShareCount)
      : zero

  if (estimatedSecondaryShareCount.eq(0) && totalIpoCost.gt(0)) {
    warnings.push('Secondary-myyntiprosentti on 0, joten IPO-kulu/osake on jaettu koko osakemäärälle.')
  }

  const capitalDividendUsedByYear = new Map<number, Decimal>()
  const grossDividendUsedByYear = new Map<number, Decimal>()
  const reimbursements = [...form.reimbursements]
    .sort((a, b) => compareDateStrings(a.date, b.date))
    .map((entry) => {
      const reimbursementDate = dateOrUndefined(entry.date, `Palautus ${entry.id} päivä`, errors)
      const amountPerShare = decimalOrZero(entry.amountPerShare, `Palautus ${entry.id} €/osake`, errors)
      const sharesHeld = sumDecimals(
        lots
          .filter(
            (lot) => !lot.dateValue || !reimbursementDate || lot.dateValue.getTime() <= reimbursementDate.getTime()
          )
          .map((lot) => lot.amount)
      )
      const expectedTotal = amountPerShare.mul(sharesHeld)
      const grossTotal = expectedTotal
      const effectivePerShare = sharesHeld.gt(0) ? grossTotal.div(sharesHeld) : zero
      const isDividend = entry.type === 'dividend'

      if (sharesHeld.eq(0) && grossTotal.gt(0)) {
        warnings.push(`Palautukselle ${entry.date} ei löytynyt omistettuja osakkeita.`)
      }
      const allocations = lots
        .filter((lot) => !lot.dateValue || !reimbursementDate || lot.dateValue.getTime() <= reimbursementDate.getTime())
        .map((lot) => {
          const gross = effectivePerShare.mul(lot.amount)
          const eligibleCapitalRepayment =
            !isDividend && isWithinYearsInclusive(lot.dateValue, reimbursementDate, 10) && lot.remainingCostTotal.gt(0)
          const remainingCostPerShare = lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero
          const capitalRepaymentPerShare = eligibleCapitalRepayment
            ? Decimal.min(effectivePerShare, remainingCostPerShare)
            : zero
          const capitalRepayment = capitalRepaymentPerShare.mul(lot.amount)
          const dividend = Decimal.max(gross.minus(capitalRepayment), zero)
          lot.remainingCostTotal = Decimal.max(lot.remainingCostTotal.minus(capitalRepayment), zero)
          lot.capitalRepaymentTotal = lot.capitalRepaymentTotal.add(capitalRepayment)
          lot.reimbursementGrossTotal = lot.reimbursementGrossTotal.add(gross)
          return {
            subscriptionId: lot.id,
            subscriptionDate: lot.date,
            shares: lot.amount,
            gross,
            capitalRepayment,
            dividend,
            remainingCostPerShareAfter: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
            eligibleCapitalRepayment,
          } satisfies ReimbursementAllocation
        })

      const capitalRepaymentTotal = sumDecimals(allocations.map((allocation) => allocation.capitalRepayment))
      const dividendTotal = sumDecimals(allocations.map((allocation) => allocation.dividend))
      const year = reimbursementDate?.getUTCFullYear()
      const mathematicalShareValuePerShare = year ? mathematicalShareValuesByYear.get(year) || zero : zero
      const shareholderMathematicalValue = mathematicalShareValuePerShare.mul(sharesHeld)
      const eightPercentYieldLimit = shareholderMathematicalValue.mul(0.08)

      if (dividendTotal.gt(0) && shareholderMathematicalValue.eq(0)) {
        warnings.push(
          `Varojenjaon ${entry.date} osinkoverotuksen jakoa ei voitu laskea ilman vuoden matemaattista arvoa / osake.`
        )
      }

      const capitalDividendGross = shareholderMathematicalValue.gt(0)
        ? Decimal.min(dividendTotal, eightPercentYieldLimit)
        : zero
      const earnedDividendGross = shareholderMathematicalValue.gt(0)
        ? Decimal.max(dividendTotal.minus(capitalDividendGross), zero)
        : zero
      const usedCapitalDividend = year ? capitalDividendUsedByYear.get(year) || zero : zero
      const lowerCapitalDividendRoom = Decimal.max(new Decimal(150000).minus(usedCapitalDividend), zero)
      const lowCapitalPart = Decimal.min(capitalDividendGross, lowerCapitalDividendRoom)
      const highCapitalPart = Decimal.max(capitalDividendGross.minus(lowCapitalPart), zero)
      const taxableCapitalIncome = lowCapitalPart.mul(0.25).add(highCapitalPart.mul(0.85))
      const taxFreeCapitalIncomePortion = lowCapitalPart.mul(0.75).add(highCapitalPart.mul(0.15))
      const taxableEarnedDividend = earnedDividendGross.mul(0.75)
      const taxFreeEarnedDividend = earnedDividendGross.mul(0.25)

      const usedGrossDividend = year ? grossDividendUsedByYear.get(year) || zero : zero
      const lowerGrossDividendRoom = Decimal.max(new Decimal(150000).minus(usedGrossDividend), zero)
      const lowWithholdingPart = Decimal.min(dividendTotal, lowerGrossDividendRoom)
      const highWithholdingPart = Decimal.max(dividendTotal.minus(lowWithholdingPart), zero)
      const withholdingToTaxOffice = lowWithholdingPart.mul(0.075).add(highWithholdingPart.mul(0.28))
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
          isDividend && !!(ipoDate && reimbursementDate && reimbursementDate.getTime() >= ipoDate.getTime()),
        allocations,
      } satisfies ReimbursementSummary
    })

  if (sellAmount.gt(totalSubscribedShares)) {
    errors.push('Myytävien osakkeiden määrä ylittää merkittyjen osakkeiden määrän.')
  }
  if (estimatedSecondaryShareCount.gt(0) && sellAmount.gt(estimatedSecondaryShareCount)) {
    warnings.push('Myyntimäärä ylittää arvioidun secondary-myyntimäärän koko yhtiön tasolla.')
  }

  let remainingSellAmount = sellAmount
  const usedSubscriptions: SellLotSummary[] = []
  for (const lot of lots) {
    if (remainingSellAmount.lte(0)) break
    const soldAmount = Decimal.min(lot.amount, remainingSellAmount)
    if (soldAmount.lte(0)) continue

    const gross = soldAmount.mul(ipoPricePerShare)
    const realCostBasis = lot.amount.gt(0) ? lot.remainingCostTotal.mul(soldAmount).div(lot.amount) : zero
    const allocatedIpoCost = soldAmount.mul(ipoCostPerShare)
    const actualDeduction = realCostBasis.add(allocatedIpoCost)
    const hankintamenoOlettaRate = isAtLeastYears(lot.dateValue, ipoDate, 10) ? new Decimal(0.4) : new Decimal(0.2)
    const hankintamenoOlettaDeduction = gross.mul(hankintamenoOlettaRate)
    const useActualCosts = actualDeduction.gte(hankintamenoOlettaDeduction)
    const selectedDeduction = useActualCosts ? actualDeduction : hankintamenoOlettaDeduction
    const selectedMethod = useActualCosts
      ? 'Todellinen hankintameno + IPO-kulut'
      : `Hankintameno-olettama ${hankintamenoOlettaRate.mul(100).toFixed(0)} %`
    const taxableGain = gross.minus(selectedDeduction)

    usedSubscriptions.push({
      subscriptionId: lot.id,
      subscriptionDate: lot.date,
      totalSubscriptionShares: lot.amount,
      soldAmount,
      gross,
      realCostBasis,
      allocatedIpoCost,
      actualDeduction,
      hankintamenoOlettaRate,
      hankintamenoOlettaDeduction,
      selectedMethod,
      selectedDeduction,
      taxableGain,
      taxFreeGainPart: zero,
      taxedGainPart: Decimal.max(taxableGain, zero),
    })

    remainingSellAmount = remainingSellAmount.minus(soldAmount)
  }

  const taxableGainTotal = sumDecimals(usedSubscriptions.map((lot) => lot.taxableGain))
  const estimatedTax = estimateCapitalTax(taxableGainTotal)
  const grossTotal = sumDecimals(usedSubscriptions.map((lot) => lot.gross))
  const totalIpoCostAllocated = sumDecimals(usedSubscriptions.map((lot) => lot.allocatedIpoCost))
  const netAfterTaxAndIpoCost = grossTotal.minus(totalIpoCostAllocated).minus(estimatedTax)

  return {
    warnings,
    errors,
    subscriptions: lots.map((lot) => ({
      id: lot.id,
      date: lot.date,
      amount: lot.amount,
      totalPrice: lot.totalPrice,
      reimbursementGrossTotal: lot.reimbursementGrossTotal,
      capitalRepaymentPerShare: lot.amount.gt(0) ? lot.capitalRepaymentTotal.div(lot.amount) : zero,
      remainingCostPerShare: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
      remainingCostTotal: lot.remainingCostTotal,
    })),
    reimbursements,
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
    },
    sell: {
      amount: sellAmount,
      usedSubscriptions,
      grossTotal,
      totalIpoCostAllocated,
      taxableGainTotal,
      estimatedTax,
      netAfterTaxAndIpoCost,
      remainingUnsoldShares: Decimal.max(totalSubscribedShares.minus(sellAmount), zero),
    },
  }
}
