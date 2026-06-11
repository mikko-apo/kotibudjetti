import Decimal from 'decimal.js'

type ShareCalculatorRemainingValues = {
  shareCount: Decimal
  shareAcquisitionCost: Decimal
}

type ShareCalculatorSubscriptionLogEntry = {
  kind: 'subscription'
  id: string
  date: string
  shareCount: Decimal
  shareAcquisitionCost: Decimal
  originalSharePrice: Decimal
  remainingAfter: ShareCalculatorRemainingValues
}

export type ShareCalculatorSellForThisSubscriptionLogEntry = {
  kind: 'sellForThisSubscription'
  id: string
  sellId: string
  date: string
  soldShareCount: Decimal
  soldShareAcquisitionCost: Decimal
  soldBaseShareAcquisitionCost: Decimal
  sellPrice: Decimal
  pricePerShare: Decimal
  remainingAfter: ShareCalculatorRemainingValues
}

type ShareCalculatorCompanyShareCountChangeLogEntry = {
  kind: 'companyShareCountChange'
  id: string
  changeId: string
  date: string
  type: string
  shareCountMultiplier: Decimal
  remainingAfter: ShareCalculatorRemainingValues
}

type ShareCalculatorCompanyAcquisitionCostChangeLogEntry = {
  kind: 'companyAcquisitionCostChange'
  id: string
  changeId: string
  date: string
  type: string
  shareAcquisitionCostMultiplier: Decimal
  remainingAfter: ShareCalculatorRemainingValues
}

type ShareCalculatorCapitalRepaymentLogEntry = {
  kind: 'capitalRepayment'
  id: string
  capitalRepaymentId: string
  date: string
  amountPerShare: Decimal
  shareCountAtEvent: Decimal
  appliedShareAcquisitionCost: Decimal
  directedToDividendTotal: Decimal
  dividendReason?: 'too_old' | 'no_remaining_cost' | 'remaining_cost_limit' | 'listed_dividend'
  remainingAfter: ShareCalculatorRemainingValues
}

type ShareCalculatorDividendLogEntry = {
  kind: 'dividend'
  id: string
  dividendId: string
  date: string
  amountPerShare: Decimal
  shareCountAtEvent: Decimal
  dividendTotal: Decimal
  remainingAfter: ShareCalculatorRemainingValues
}

export type ShareCalculatorLogEntry =
  | ShareCalculatorSubscriptionLogEntry
  | ShareCalculatorSellForThisSubscriptionLogEntry
  | ShareCalculatorCompanyShareCountChangeLogEntry
  | ShareCalculatorCompanyAcquisitionCostChangeLogEntry
  | ShareCalculatorCapitalRepaymentLogEntry
  | ShareCalculatorDividendLogEntry
