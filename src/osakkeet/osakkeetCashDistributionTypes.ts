import type Decimal from 'decimal.js'

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
