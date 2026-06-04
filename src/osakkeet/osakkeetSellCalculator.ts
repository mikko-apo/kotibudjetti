import Decimal from 'decimal.js'
import type { WorkingLot } from './osakkeetParsedData'
import type { ShareCalculator } from './shareCalculator'
import { isAtLeastYears, sumDecimals } from './osakkeetUtils'

const zero = new Decimal(0)

export type SellTaxRules = {
  capitalIncomeTax: {
    threshold: number
    lowRate: number
    highRate: number
  }
  hankintamenoOlettama: {
    ownershipYearsThreshold: number
    shortOwnershipRate: number
    longOwnershipRate: number
  }
}

export type SellLotSummary = {
  lotId: string
  lotDate: string
  totalLotShares: Decimal
  soldAmount: Decimal
  gross: Decimal
  originalCostBasis: Decimal
  realCostBasis: Decimal
  allocatedSellCost: Decimal
  actualDeduction: Decimal
  hankintamenoOlettaRate: Decimal
  hankintamenoOlettaDeduction: Decimal
  selectedMethod: 'actual_costs' | 'hmo'
  selectedDeduction: Decimal
  taxableGain: Decimal
  taxFreeGainPart: Decimal
  taxedGainPart: Decimal
}

export type SellSummary = {
  amount: Decimal
  otherAnnualCapitalGainsOrLosses: Decimal
  usedLots: SellLotSummary[]
  grossTotal: Decimal
  cashAfterSellCosts: Decimal
  taxFreeAcquisitionRecoveryAfterSellCosts: Decimal
  soldShareOriginalCostTotal: Decimal
  soldShareAcquisitionCostTotal: Decimal
  selectedActualDeductionTotal: Decimal
  selectedHmo20DeductionTotal: Decimal
  selectedHmo40DeductionTotal: Decimal
  selectedHmoDeductionTotal: Decimal
  selectedDeductionTotal: Decimal
  totalAllocatedSellCost: Decimal
  sellCostDeductedViaActual: Decimal
  sellCostPaidWithoutActualDeduction: Decimal
  taxSavedFromDeductibleSellCosts: Decimal
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
  netAfterTaxAndSellCost: Decimal
  netAfterAnnualTaxAndSellCost: Decimal
  netResultAgainstAcquisitionCost: Decimal
  remainingUnsoldShares: Decimal
}

function estimateCapitalTax(taxableGain: Decimal, rules: SellTaxRules) {
  if (taxableGain.lte(0)) return zero
  const threshold = new Decimal(rules.capitalIncomeTax.threshold)
  const lowPart = Decimal.min(taxableGain, threshold)
  const highPart = Decimal.max(taxableGain.minus(threshold), zero)
  return lowPart.mul(rules.capitalIncomeTax.lowRate).add(highPart.mul(rules.capitalIncomeTax.highRate))
}

export function calculateSellSummary(params: {
  sellableLots: WorkingLot[]
  totalTrackedShares: Decimal
  sellShareCalculator: ShareCalculator
  sellId: string
  sellAmount: Decimal
  otherAnnualCapitalGainsOrLosses: Decimal
  sellDate?: Date
  sellPricePerShare: Decimal
  sellCostPerShare: Decimal
  sellRules: SellTaxRules
}): SellSummary {
  const {
    sellableLots,
    totalTrackedShares,
    sellShareCalculator,
    sellId,
    sellAmount,
    otherAnnualCapitalGainsOrLosses,
    sellDate,
    sellPricePerShare,
    sellCostPerShare,
    sellRules,
  } = params

  const usedLots: SellLotSummary[] = sellableLots.flatMap((lot) => {
    const sellAllocations = (sellShareCalculator.sellsForThisSubscriptionLotsBySubscriptionId[lot.id] || []).filter(
      (allocation) => allocation.sellId === sellId
    )

    return sellAllocations.map((allocation) => {
      const soldAmount = allocation.soldShareCount
      const gross = soldAmount.mul(sellPricePerShare)
      const originalCostBasis = allocation.soldBaseShareAcquisitionCost
      const realCostBasis = allocation.soldShareAcquisitionCost
      const allocatedSellCost = soldAmount.mul(sellCostPerShare)
      const actualDeduction = realCostBasis.add(allocatedSellCost)
      const hankintamenoOlettaRate = isAtLeastYears(
        lot.dateValue,
        sellDate,
        sellRules.hankintamenoOlettama.ownershipYearsThreshold
      )
        ? new Decimal(sellRules.hankintamenoOlettama.longOwnershipRate)
        : new Decimal(sellRules.hankintamenoOlettama.shortOwnershipRate)
      const hankintamenoOlettaDeduction = gross.mul(hankintamenoOlettaRate)
      const useActualCosts = actualDeduction.gte(hankintamenoOlettaDeduction)
      const selectedDeduction = useActualCosts ? actualDeduction : hankintamenoOlettaDeduction
      const taxableGain = gross.minus(selectedDeduction)

      return {
        lotId: lot.id,
        lotDate: lot.date,
        totalLotShares: lot.shareCount,
        soldAmount,
        gross,
        originalCostBasis,
        realCostBasis,
        allocatedSellCost,
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

  const taxableGainTotal = sumDecimals(usedLots.map((lot) => lot.taxableGain))
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
  const grossTotal = sumDecimals(usedLots.map((lot) => lot.gross))
  const selectedActualDeductionTotal = sumDecimals(
    usedLots.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.actualDeduction)
  )
  const shortOwnershipRate = new Decimal(sellRules.hankintamenoOlettama.shortOwnershipRate)
  const longOwnershipRate = new Decimal(sellRules.hankintamenoOlettama.longOwnershipRate)
  const selectedHmo20DeductionTotal = sumDecimals(
    usedLots
      .filter((lot) => lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(shortOwnershipRate))
      .map((lot) => lot.hankintamenoOlettaDeduction)
  )
  const selectedHmo40DeductionTotal = sumDecimals(
    usedLots
      .filter((lot) => lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(longOwnershipRate))
      .map((lot) => lot.hankintamenoOlettaDeduction)
  )
  const selectedHmoDeductionTotal = selectedHmo20DeductionTotal.add(selectedHmo40DeductionTotal)
  const selectedDeductionTotal = sumDecimals(usedLots.map((lot) => lot.selectedDeduction))
  const soldSharesTotal = sumDecimals(usedLots.map((lot) => lot.soldAmount))
  const totalAllocatedSellCost = sumDecimals(usedLots.map((lot) => lot.allocatedSellCost))
  const cashAfterSellCosts = grossTotal.minus(totalAllocatedSellCost)
  const taxFreeAcquisitionRecoveryAfterSellCosts = Decimal.max(
    selectedDeductionTotal.minus(totalAllocatedSellCost),
    zero
  )
  const soldShareOriginalCostTotal = sumDecimals(usedLots.map((lot) => lot.originalCostBasis))
  const soldShareAcquisitionCostTotal = sumDecimals(usedLots.map((lot) => lot.realCostBasis))
  const sellCostDeductedViaActual = sumDecimals(
    usedLots.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.allocatedSellCost)
  )
  const sellCostPaidWithoutActualDeduction = sumDecimals(
    usedLots.filter((lot) => lot.selectedMethod === 'hmo').map((lot) => lot.allocatedSellCost)
  )
  const taxSavedFromDeductibleSellCosts = estimateCapitalTax(
    taxableGainTotal.add(sellCostDeductedViaActual),
    sellRules
  ).minus(estimatedTax)
  const netAfterTaxAndSellCost = grossTotal.minus(totalAllocatedSellCost).minus(estimatedTax)
  const netAfterAnnualTaxAndSellCost = grossTotal.minus(totalAllocatedSellCost).minus(annualEstimatedTax)
  const netResultAgainstAcquisitionCost = netAfterTaxAndSellCost.minus(soldShareAcquisitionCostTotal)

  return {
    amount: sellAmount,
    otherAnnualCapitalGainsOrLosses,
    usedLots,
    grossTotal,
    cashAfterSellCosts,
    taxFreeAcquisitionRecoveryAfterSellCosts,
    soldShareOriginalCostTotal,
    soldShareAcquisitionCostTotal,
    selectedActualDeductionTotal,
    selectedHmo20DeductionTotal,
    selectedHmo40DeductionTotal,
    selectedHmoDeductionTotal,
    selectedDeductionTotal,
    totalAllocatedSellCost,
    sellCostDeductedViaActual,
    sellCostPaidWithoutActualDeduction,
    taxSavedFromDeductibleSellCosts,
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
    netAfterTaxAndSellCost,
    netAfterAnnualTaxAndSellCost,
    netResultAgainstAcquisitionCost,
    remainingUnsoldShares: Decimal.max(totalTrackedShares.minus(soldSharesTotal), zero),
  }
}
