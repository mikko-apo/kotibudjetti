import type { OsakkeetCalculation } from './osakkeetCalculator'
import { amount, euro, multiplier, percentage } from './osakkeetFormat'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import type { ShareCalculatorLogEntry } from './shareCalculator'

type FixedSummaryValue = OsakkeetCalculation['vesting']['totalShares']
export type SubscriptionHistoryRow = {
  date: string
  event: string
  shareCount: string
  shareCost: string
  pricePerShare: string
  details: string
}

function capitalRepaymentDividendReasonText(
  reason: Extract<ShareCalculatorLogEntry, { kind: 'capitalRepayment' }>['dividendReason'],
  texts: OsakkeetLocalization
) {
  if (reason === 'too_old') return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonTooOld
  if (reason === 'no_remaining_cost')
    return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonNoRemainingCost
  if (reason === 'remaining_cost_limit') {
    return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonRemainingCostLimit
  }
  return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonListedDividend
}

export function createSummaryById<TSummary extends { id: string }>(summaries: TSummary[]) {
  const summariesById: Record<string, TSummary | undefined> = {}
  summaries.forEach((summary) => {
    summariesById[summary.id] = summary
  })
  return summariesById
}

export function createSubscriptionHistoryRows(
  summary: OsakkeetCalculation['subscriptions'][number] | undefined,
  texts: OsakkeetLocalization
): SubscriptionHistoryRow[] {
  if (!summary) return []
  return summary.shareCalculatorLog.map((entry) => {
    const pricePerShare = entry.remainingAfter.shareCount.gt(0)
      ? euro(entry.remainingAfter.shareAcquisitionCost.div(entry.remainingAfter.shareCount))
      : euro(0)
    if (entry.kind === 'subscription') {
      return {
        date: entry.date,
        event: texts.subscriptions.history.events.subscription,
        shareCount: amount(entry.remainingAfter.shareCount),
        shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
        pricePerShare,
        details: texts.subscriptions.history.details.subscription(
          amount(entry.shareCount),
          euro(entry.shareAcquisitionCost),
          entry.shareCount.gt(0) ? euro(entry.shareAcquisitionCost.div(entry.shareCount)) : euro(0)
        ),
      }
    }
    if (entry.kind === 'companyShareCountChange') {
      return {
        date: entry.date,
        event: texts.subscriptions.history.events.split,
        shareCount: amount(entry.remainingAfter.shareCount),
        shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
        pricePerShare,
        details: texts.subscriptions.history.details.split(
          entry.shareCountMultiplier.gt(0)
            ? amount(entry.remainingAfter.shareCount.div(entry.shareCountMultiplier))
            : amount(0),
          multiplier(entry.shareCountMultiplier),
          amount(entry.remainingAfter.shareCount)
        ),
      }
    }
    if (entry.kind === 'companyAcquisitionCostChange') {
      return {
        date: entry.date,
        event: texts.subscriptions.history.events.demerger,
        shareCount: amount(entry.remainingAfter.shareCount),
        shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
        pricePerShare,
        details: texts.subscriptions.history.details.demerger(
          entry.shareAcquisitionCostMultiplier.gt(0)
            ? euro(entry.remainingAfter.shareAcquisitionCost.div(entry.shareAcquisitionCostMultiplier))
            : euro(0),
          amount(entry.shareAcquisitionCostMultiplier),
          euro(entry.remainingAfter.shareAcquisitionCost)
        ),
      }
    }
    if (entry.kind === 'sellForThisSubscription') {
      return {
        date: entry.date,
        event: texts.subscriptions.history.events.sell,
        shareCount: amount(entry.remainingAfter.shareCount),
        shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
        pricePerShare,
        details: texts.subscriptions.history.details.sell(
          amount(entry.soldShareCount),
          euro(entry.sellPrice),
          euro(entry.pricePerShare)
        ),
      }
    }
    const appliedPerShare = entry.shareCountAtEvent.gt(0)
      ? entry.appliedShareAcquisitionCost.div(entry.shareCountAtEvent)
      : entry.amountPerShare.mul(0)
    const dividendPerShare = entry.shareCountAtEvent.gt(0)
      ? entry.directedToDividendTotal.div(entry.shareCountAtEvent)
      : entry.amountPerShare.mul(0)
    return {
      date: entry.date,
      event: texts.subscriptions.history.events.capitalRepayment,
      shareCount: amount(entry.remainingAfter.shareCount),
      shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
      pricePerShare,
      details:
        entry.appliedShareAcquisitionCost.gt(0) && entry.directedToDividendTotal.gt(0)
          ? texts.subscriptions.history.details.capitalRepaymentAppliedAndDividend(
              euro(entry.amountPerShare),
              amount(entry.shareCountAtEvent),
              euro(appliedPerShare),
              euro(entry.appliedShareAcquisitionCost),
              euro(dividendPerShare),
              euro(entry.directedToDividendTotal),
              capitalRepaymentDividendReasonText(entry.dividendReason || 'remaining_cost_limit', texts)
            )
          : entry.appliedShareAcquisitionCost.gt(0)
            ? texts.subscriptions.history.details.capitalRepaymentAppliedOnly(
                euro(entry.amountPerShare),
                amount(entry.shareCountAtEvent),
                euro(appliedPerShare),
                euro(entry.appliedShareAcquisitionCost)
              )
            : texts.subscriptions.history.details.capitalRepaymentDividendOnly(
                euro(entry.amountPerShare),
                amount(entry.shareCountAtEvent),
                euro(dividendPerShare),
                euro(entry.directedToDividendTotal),
                capitalRepaymentDividendReasonText(entry.dividendReason || 'listed_dividend', texts)
              ),
    }
  })
}

export function createSubscriptionHistoryTooltip(historyRows: SubscriptionHistoryRow[], texts: OsakkeetLocalization) {
  if (historyRows.length === 0) return texts.subscriptions.history.empty
  const header = [
    texts.subscriptions.history.fields.date,
    texts.subscriptions.history.fields.event,
    texts.subscriptions.history.fields.shareCount,
    texts.subscriptions.history.fields.shareCost,
    texts.subscriptions.history.fields.pricePerShare,
    texts.subscriptions.history.fields.details,
  ].join(' | ')
  const rows = historyRows.map((entry) =>
    [entry.date, entry.event, entry.shareCount, entry.shareCost, entry.pricePerShare, entry.details].join(' | ')
  )
  return [header, ...rows].join('\n')
}

export function createTotalPricePerShareTooltip(
  summary: OsakkeetCalculation['subscriptions'][number] | undefined,
  texts: OsakkeetLocalization
) {
  if (!summary) return ''
  const explanation = summary.acquisitionCostExplanation

  const lines = [
    texts.subscriptions.fields.totalPricePerShareTooltipBase(
      amount(explanation.originalAmount),
      euro(explanation.originalPricePerShare),
      euro(explanation.originalOtherTotalAcquisitionCosts),
      euro(explanation.originalTotalPrice)
    ),
  ]

  for (const event of explanation.adjustments) {
    if (event.kind === 'demerger') {
      lines.push(
        texts.subscriptions.fields.totalPricePerShareTooltipDemerger(
          event.date,
          euro(event.beforeTotalPrice),
          amount(event.oldCompanyRatio),
          euro(event.afterTotalPrice)
        )
      )
      continue
    }

    lines.push(
      texts.subscriptions.fields.totalPricePerShareTooltipSplit(
        event.date,
        amount(event.beforeShares),
        amount(event.multiplier),
        amount(event.afterShares)
      )
    )
  }

  lines.push(
    texts.subscriptions.fields.totalPricePerShareTooltipResult(
      euro(summary.totalPrice),
      amount(summary.amount),
      euro(summary.totalPricePerShare)
    )
  )
  return lines.join('\n')
}

export function createRemainingCostPerShareTooltip(
  summary: OsakkeetCalculation['subscriptions'][number] | undefined,
  texts: OsakkeetLocalization
) {
  if (!summary) return ''

  const lines = [texts.subscriptions.fields.remainingCostPerShareTooltipBase(euro(summary.totalPrice))]
  for (const entry of summary.capitalRepaymentBreakdown) {
    lines.push(
      texts.subscriptions.fields.remainingCostPerShareTooltipCapitalRepayment(
        entry.distributionDate,
        euro(entry.capitalRepaymentPerShare),
        amount(entry.shares),
        euro(entry.capitalRepaymentTotal)
      )
    )
  }
  lines.push(
    texts.subscriptions.fields.remainingCostPerShareTooltipResult(
      euro(summary.totalPrice),
      euro(summary.capitalRepaymentTotal),
      euro(summary.remainingCostTotal),
      amount(summary.amount),
      euro(summary.remainingCostPerShare)
    )
  )

  return lines.join('\n')
}

export function createSharePercent(totalShares: FixedSummaryValue) {
  return (value: FixedSummaryValue) =>
    totalShares.gt(0)
      ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})`
      : `${amount(value)} (0.00 %)`
}

function formatDateLabel(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}.${month}.${year}`
}

export function createSubscriptionsSummaryCards(
  infoCard: (title: string, value: string, help?: string) => unknown,
  totalShares: FixedSummaryValue,
  vestedShares: FixedSummaryValue,
  unvestedShares: FixedSummaryValue,
  currentDate: Date,
  texts: OsakkeetLocalization
) {
  const sharePercent = createSharePercent(totalShares)
  const referenceDate = formatDateLabel(currentDate)
  return [
    infoCard(texts.subscriptions.summary.totalShares, amount(totalShares)),
    infoCard(texts.subscriptions.summary.vestedSharesAtDate(referenceDate), sharePercent(vestedShares)),
    infoCard(texts.subscriptions.summary.unvestedSharesAtDate(referenceDate), sharePercent(unvestedShares)),
  ]
}
