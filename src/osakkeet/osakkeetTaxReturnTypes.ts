import type Decimal from 'decimal.js'
import type { SellSummary } from './osakkeetSellCalculator'

export type TaxReturnTotals = {
  paidInCash: Decimal
  withholdingToTaxOffice: Decimal
  capitalRepaymentTotal: Decimal
  dividendTotal: Decimal
  taxableCapitalIncome: Decimal
  taxFreeCapitalIncome: Decimal
  taxableEarnedDividend: Decimal
  taxFreeEarnedDividend: Decimal
}

export type TaxReturnSectionSummary<TEntry> = {
  mode: 'unlisted' | 'listed'
  entries: TEntry[]
  totals: TaxReturnTotals
}

export type TaxReturnAssetSummary = {
  date: string
  shareCount: Decimal
  mathematicalShareValuePerShare: Decimal
  shareholderMathematicalValue: Decimal
  remainingAcquisitionCost: Decimal
}

export type TaxReturnSaleSummary = {
  year: number
  sellDate: string
  summary: SellSummary
}

export type TaxReturnYearSummary<TDistributionEntry> = {
  year: number
  missingMathematicalValueWarningDates: string[]
  assets?: TaxReturnAssetSummary
  unlisted?: TaxReturnSectionSummary<TDistributionEntry>
  listed?: TaxReturnSectionSummary<TDistributionEntry>
  sales?: TaxReturnSaleSummary[]
}
