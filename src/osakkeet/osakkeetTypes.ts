export type ShareSubscriptionInput = {
  id: string
  date: string
  vestingEndsOn?: string
  amount: string
  pricePerShare?: string
  otherTotalAcquisitionCosts?: string
  totalPrice?: string
}

export type CashDistributionInput = {
  id: string
  date: string
  type: 'capital_return' | 'dividend'
  amountPerShare: string
  shareCount?: string
}

export type ShareSplitInput = {
  id: string
  date: string
  multiplier: string
}

export type DemergerInput = {
  id: string
  date: string
  oldCompanyRatio: string
}

export type ShareSellInput = {
  id: string
  date: string
  shareCount: string
  sellPrice: string
  pricePerShare?: string
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
  otherAnnualCapitalGainsOrLosses?: string
}

export type OsakkeetFormData = {
  subscriptions: ShareSubscriptionInput[]
  sells: ShareSellInput[]
  cashDistributions: CashDistributionInput[]
  shareSplits: ShareSplitInput[]
  demergers: DemergerInput[]
  mathematicalShareValues: MathematicalShareValueInput[]
  ipo: IpoDetailsInput
  sell: IpoSellDetailsInput
}
