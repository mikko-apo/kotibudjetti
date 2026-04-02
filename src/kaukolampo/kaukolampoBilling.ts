import Decimal from 'decimal.js'
import { isDefined } from '../../../ki-frame/src/util/typeUtils'
import type {
  ContractPricing,
  InterestTypeTotals,
  MonthBillInfo,
  MonthlyPrice,
  PaybackInterestMonth,
  PaybackInterestYear,
  YearMonth,
  YearTotal,
  YearTotalTotals,
} from './kaukolampoTypes'
import { range } from './range'
import { toDate } from './util'
import { calculateViivastyskorkoMultiplier } from './viivastyskorko'

export const ymToIndex = (ym: YearMonth) => ym.year * 12 + (ym.month - 1)
export const indexToYm = (idx: number): YearMonth => {
  const year = Math.floor(idx / 12)
  const month = (idx % 12) + 1
  return { year, month }
}

export function resolveMonthlyPricingLookup(
  contract: ContractPricing,
  from: YearMonth,
  to: YearMonth
): Record<number, MonthlyPrice> {
  const result: Record<number, MonthlyPrice> = {}
  const sortedPricesDesc = [...contract.monthlyPricing].sort((a, b) => ymToIndex(b) - ymToIndex(a))
  for (let c = ymToIndex(from); c <= ymToIndex(to); c++) {
    const firstLower = sortedPricesDesc.find((value) => ymToIndex(value) <= c && value.price)
    if (firstLower && isDefined(firstLower.price)) {
      const { monthlyFee, powerPricePerMW } = firstLower.price
      result[c] = {
        monthlyFee: Decimal(monthlyFee),
        powerPrice: Decimal(powerPricePerMW),
      }
    } else {
      throw new Error(`${indexToYm(c)} is not in the range of contract prices for ${contract.id}`)
    }
  }
  return result
}

export const months = range(1, 12)

export function calculateValues(
  years: number[],
  monthlyPricing: Record<number, MonthlyPrice>,
  powerUsage: Record<number, Decimal>
) {
  const totalsByYear: Record<number, YearTotal> = {}
  const monthBillInfos: Record<number, MonthBillInfo> = {}
  years.forEach((year, index) => {
    const yearTotal: YearTotal = {
      usedPower: Decimal(0),
      monthCount: 0,
      billedTotals: {
        usedPowerPrice: Decimal(0),
        monthlyFees: Decimal(0),
        total: Decimal(0),
      },
      calculatedTotals: {
        comparedToPreviousYear: true,
        usedPowerPrice: Decimal(0),
        monthlyFees: Decimal(0),
        total: Decimal(0),
        avgMonthlyFee: Decimal(0),
        avgPowerPrice: Decimal(0),
        excessBilling: Decimal(0),
      },
    }
    months.forEach((month) => {
      const index = ymToIndex({ year, month })
      const usedPower = powerUsage[index]
      if (usedPower) {
        const price = monthlyPricing[index]
        const usedPowerPrice = usedPower.mul(price.powerPrice)
        const prevPrice: MonthlyPrice = monthlyPricing[index - 1] || price
        const total = usedPowerPrice.add(price.monthlyFee)
        monthBillInfos[index] = {
          index,
          ...price,
          usedPower,
          usedPowerPrice,
          mWPriceDelta: price.powerPrice.sub(prevPrice.powerPrice).toNumber(),
          monthlyFeeDelta: price.monthlyFee.sub(prevPrice.monthlyFee).toNumber(),
          total,
        }
        yearTotal.usedPower = yearTotal.usedPower.add(usedPower)
        const billedTotals = yearTotal.billedTotals
        billedTotals.monthlyFees = billedTotals.monthlyFees.add(price.monthlyFee)
        billedTotals.usedPowerPrice = billedTotals.usedPowerPrice.add(usedPowerPrice)
        billedTotals.total = billedTotals.total.add(total)
        yearTotal.monthCount = yearTotal.monthCount + 1
      }
    })
    // calculate mwPrice and monthlyFee averages over the year
    yearTotal.calculatedTotals = {
      ...yearTotal.billedTotals,
      comparedToPreviousYear: false,
      avgPowerPrice: yearTotal.billedTotals.usedPowerPrice.div(yearTotal.usedPower),
      avgMonthlyFee: yearTotal.billedTotals.monthlyFees.div(yearTotal.monthCount),
      excessBilling: Decimal(0),
    }

    // check if price has increased over limits
    if (index > 0) {
      const prevYear = year - 1
      const prevTotals = totalsByYear[prevYear].calculatedTotals
      const prevMonthlyFees = prevTotals.avgMonthlyFee.mul(yearTotal.monthCount)
      const prevUsedPowerPrice = yearTotal.usedPower.mul(prevTotals.avgPowerPrice)
      const totalsBasedOnLastYearLevel: YearTotalTotals = {
        monthlyFees: prevMonthlyFees,
        usedPowerPrice: prevUsedPowerPrice,
        total: prevMonthlyFees.add(prevUsedPowerPrice),
      }
      yearTotal.totalsBasedOnLastYearLevel = totalsBasedOnLastYearLevel
      const billedTotal = yearTotal.billedTotals.total
      const priceIncreaseEuros = billedTotal.minus(totalsBasedOnLastYearLevel.total)
      const priceIncreasePercents = billedTotal.div(totalsBasedOnLastYearLevel.total).minus(1).mul(100)
      const priceIncreaseTooMuch = priceIncreaseEuros.toNumber() > 150 && priceIncreasePercents.toNumber() > 15
      if (priceIncreaseTooMuch) {
        const total = totalsBasedOnLastYearLevel.total.add(150)
        const adjustmentMultiplier = total.div(totalsBasedOnLastYearLevel.total)
        const avgMonthlyFee = prevTotals.avgMonthlyFee.mul(adjustmentMultiplier)
        const avgPowerPrice = prevTotals.avgPowerPrice.mul(adjustmentMultiplier)
        yearTotal.calculatedTotals = {
          usedPowerPrice: avgPowerPrice.mul(yearTotal.usedPower),
          monthlyFees: avgMonthlyFee.mul(yearTotal.monthCount),
          total,
          avgMonthlyFee,
          avgPowerPrice,
          adjustmentMultiplier,
          excessBilling: billedTotal.minus(total),
          comparedToPreviousYear: true,
          priceIncreaseTooMuch,
          priceIncreasePercents,
          priceIncreaseEuros,
        }
      } else {
        yearTotal.calculatedTotals.comparedToPreviousYear = true
        yearTotal.calculatedTotals.priceIncreasePercents = priceIncreasePercents
        yearTotal.calculatedTotals.priceIncreaseEuros = priceIncreaseEuros
      }
    }

    totalsByYear[year] = yearTotal
  })
  const excessYears = years.filter((y) => totalsByYear[y].calculatedTotals.excessBilling.toNumber() > 0)
  const paybackInterestYears = calculatePaybackInterest(excessYears, monthBillInfos, totalsByYear)
  return { totalsByYear, monthBillInfos, excessYears, paybackInterestYears, years }
}

function decimalMin(a: Decimal, b: Decimal) {
  if (a.toNumber() <= b.toNumber()) {
    return a
  }
  return b
}

export function calculatePaybackInterest(
  excessYears: number[],
  originalBills: Record<number, MonthBillInfo>,
  totalsByYear: Record<number, YearTotal>
): PaybackInterestYear[] {
  return excessYears.map((year): PaybackInterestYear => {
    let billedTotal = Decimal(0)
    const fromAveragePricesTotals: InterestTypeTotals = {
      total: Decimal(0),
      excess: Decimal(0),
      interest: Decimal(0),
    }
    const comparingToPreviousYearAnd150BufferTotals: InterestTypeTotals = {
      total: Decimal(0),
      excess: Decimal(0),
      interest: Decimal(0),
    }

    const yearTotal = totalsByYear[year].calculatedTotals
    const prevTotal = totalsByYear[year - 1].calculatedTotals
    function calculateInterestMultiplier(month: number) {
      const startDate = toDate(year, month, 1)
      const viivastyskorkoMultiplier = calculateViivastyskorkoMultiplier(startDate, new Date(), true)
      return viivastyskorkoMultiplier.multiplier
    }
    function calculateExcessFromAveragePrices(originalBill: MonthBillInfo, originalTotal: Decimal, month: number) {
      const usedPowerPrice = originalBill.usedPower.mul(yearTotal.avgPowerPrice)
      const calculatedTotal = usedPowerPrice.plus(yearTotal.avgMonthlyFee)
      const excess = originalTotal.minus(calculatedTotal)
      const interest = excess.mul(Decimal(calculateInterestMultiplier(month)).minus(1))
      fromAveragePricesTotals.total = fromAveragePricesTotals.total.add(calculatedTotal)
      fromAveragePricesTotals.excess = fromAveragePricesTotals.excess.add(excess)
      fromAveragePricesTotals.interest = fromAveragePricesTotals.interest.add(interest)
      return {
        monthlyFee: yearTotal.avgMonthlyFee,
        powerPrice: yearTotal.avgPowerPrice,
        usedPowerPrice: usedPowerPrice,
        total: calculatedTotal,
        excess,
        interest,
      }
    }
    let leftFrom150 = Decimal(150)

    const months = range(1, 12).map((month): PaybackInterestMonth | undefined => {
      const index = ymToIndex({ year, month })
      const originalBill = originalBills[index]
      if (!originalBill) return undefined
      const originalTotal = originalBill.total
      billedTotal = billedTotal.add(originalTotal)

      const usedPowerPrice = originalBill.usedPower.mul(prevTotal.avgPowerPrice)
      const totalWithLastYearLevel = usedPowerPrice.add(prevTotal.avgMonthlyFee)
      let total = billedTotal
      let excess = Decimal(0)
      let interest = Decimal(0)
      const delta = originalTotal.minus(totalWithLastYearLevel)
      if (delta.toNumber() > 0) {
        if (leftFrom150.toNumber() > 0) {
          const useBuffer = decimalMin(leftFrom150, delta)
          leftFrom150 = leftFrom150.minus(useBuffer)
          total = totalWithLastYearLevel.plus(useBuffer)
          excess = originalTotal.minus(total)
        } else {
          total = totalWithLastYearLevel
          excess = delta
        }
        if (excess.toNumber() > 0) {
          interest = excess.mul(Decimal(calculateInterestMultiplier(month)).minus(1))
        }
      }
      const excessComparingToPreviousYearAnd150Buffer = {
        monthlyFee: prevTotal.avgMonthlyFee,
        powerPrice: prevTotal.avgPowerPrice,
        usedPowerPrice,
        totalWithLastYearLevel,
        total,
        excess,
        interest,
        leftFrom150,
      }
      comparingToPreviousYearAnd150BufferTotals.total = comparingToPreviousYearAnd150BufferTotals.total.add(total)
      comparingToPreviousYearAnd150BufferTotals.excess = comparingToPreviousYearAnd150BufferTotals.excess.add(excess)
      comparingToPreviousYearAnd150BufferTotals.interest =
        comparingToPreviousYearAnd150BufferTotals.interest.add(interest)
      return {
        month,
        originalBill,
        excessFromAveragePrices: calculateExcessFromAveragePrices(originalBill, originalTotal, month),
        excessComparingToPreviousYearAnd150Buffer,
      }
    })
    return {
      year,
      months: months.filter(isDefined),
      billedTotal,
      fromAveragePricesTotals,
      comparingToPreviousYearAnd150BufferTotals,
    }
  })
}
