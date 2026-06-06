import Decimal from 'decimal.js'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import type { ParsedIpoInputs, ParsedIpoSellInputs, WorkingLot } from './osakkeetParsedData'
import type { ShareCalculator } from './shareCalculator'
import {
  calculateSellSummary,
  createEmptySellSummary,
  type SellSummary,
  type SellTaxRules,
} from './osakkeetSellCalculator'
import { sumDecimals } from './osakkeetUtils'

const zero = new Decimal(0)

export type IpoSummary = {
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

export type VestingSummary = {
  totalShares: Decimal
  vestedShares: Decimal
  unvestedShares: Decimal
  sellableLots: WorkingLot[]
  lockedLots: WorkingLot[]
}

export function buildIpoSummaryFromInputs(
  ipoInput: ParsedIpoInputs,
  ipoSellInput: ParsedIpoSellInputs,
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
  const ipoSellAmount = ipoSellInput.amount
  const otherAnnualCapitalGainsOrLosses = ipoSellInput.otherAnnualCapitalGainsOrLosses

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
    ipoSellAmount,
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

export function calculateVestingSummary(lots: WorkingLot[], ipoDate?: Date): VestingSummary {
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

export function calculateIpoSellSummary(
  sellableLots: WorkingLot[],
  sellShareCalculator: ShareCalculator,
  ipoSellAmount: Decimal,
  ipoSellPricePerShare: Decimal,
  ipoSellCostPerShare: Decimal,
  otherAnnualCapitalGainsOrLosses: Decimal,
  vestingSummary: VestingSummary,
  ipoSummary: IpoSummary,
  sellRules: SellTaxRules,
  errors: string[],
  warnings: string[],
  localization: OsakkeetLocalization
): SellSummary {
  if (ipoSellAmount.gt(0) && !ipoSummary.ipoDate && vestingSummary.lockedLots.length > 0) {
    warnings.push(localization.calculator.warnings.vestingBlockedWithoutIpoDate)
  }
  if (ipoSellAmount.gt(vestingSummary.vestedShares)) {
    errors.push(localization.calculator.errors.ipoSellAmountExceedsSellable(vestingSummary.vestedShares.toString()))
  }
  if (ipoSummary.estimatedSecondaryShareCount.gt(0) && ipoSellAmount.gt(ipoSummary.estimatedSecondaryShareCount)) {
    warnings.push(localization.calculator.warnings.ipoSellAmountExceedsEstimatedSecondary)
  }
  if (ipoSellAmount.gt(0) && ipoSellPricePerShare.lte(0)) {
    errors.push(localization.calculator.errors.ipoSellPricePerShareRequired)
    return createEmptySellSummary({
      amount: ipoSellAmount,
      otherAnnualCapitalGainsOrLosses,
      remainingUnsoldShares: ipoSummary.totalSubscribedShares,
    })
  }

  return calculateSellSummary({
    sellableLots,
    totalTrackedShares: ipoSummary.totalSubscribedShares,
    sellShareCalculator,
    sellId: 'ipo-sell',
    sellAmount: ipoSellAmount,
    otherAnnualCapitalGainsOrLosses,
    sellDate: ipoSummary.ipoDate,
    sellPricePerShare: ipoSellPricePerShare,
    sellCostPerShare: ipoSellCostPerShare,
    sellRules,
  })
}
