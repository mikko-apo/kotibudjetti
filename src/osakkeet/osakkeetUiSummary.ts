import type { OsakkeetCalculation } from './osakkeetUiCalculator'
import { amount, createSharePercentFormatter, euro, formatDateLabel, multiplier } from './osakkeetFormat'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import type { WorkingLot } from './osakkeetParsedData'
import type { ShareCalculatorLogEntry } from './shareCalculatorTypes'

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

export function zipRowsWithSummaries<TRow extends { id: string }, TSummary extends { id: string }>(
  rows: readonly TRow[],
  summaries: readonly TSummary[]
) {
  const summariesById = new Map(summaries.map((summary) => [summary.id, summary]))
  return rows.map((row) => ({
    row,
    summary: summariesById.get(row.id),
  }))
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
    if (entry.kind === 'dividend') {
      return {
        date: entry.date,
        event: texts.subscriptions.history.events.dividend,
        shareCount: amount(entry.remainingAfter.shareCount),
        shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
        pricePerShare,
        details: texts.subscriptions.history.details.dividend(
          euro(entry.amountPerShare),
          amount(entry.shareCountAtEvent),
          euro(entry.dividendTotal)
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

function getTotalPricePerShare(lot: WorkingLot) {
  return lot.shareCount.gt(0) ? lot.baseShareAcquisitionCost.div(lot.shareCount) : lot.baseShareAcquisitionCost.mul(0)
}

function getRemainingCostPerShare(lot: WorkingLot) {
  return lot.shareCount.gt(0) ? lot.shareAcquisitionCost.div(lot.shareCount) : lot.shareAcquisitionCost.mul(0)
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

  const lines = [
    texts.subscriptions.fields.totalPricePerShareTooltipBase(
      amount(summary.originalShareCount),
      euro(summary.originalSharePrice),
      euro(summary.originalOtherTotalAcquisitionCosts),
      euro(summary.originalShareAcquisitionCost)
    ),
  ]

  for (const event of summary.acquisitionCostAdjustments) {
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
      euro(summary.baseShareAcquisitionCost),
      amount(summary.shareCount),
      euro(getTotalPricePerShare(summary))
    )
  )
  return lines.join('\n')
}

export function createRemainingCostPerShareTooltip(
  summary: OsakkeetCalculation['subscriptions'][number] | undefined,
  texts: OsakkeetLocalization
) {
  if (!summary) return ''

  const lines = [texts.subscriptions.fields.remainingCostPerShareTooltipBase(euro(summary.baseShareAcquisitionCost))]
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
      euro(summary.baseShareAcquisitionCost),
      euro(summary.capitalRepaymentTotal),
      euro(summary.shareAcquisitionCost),
      amount(summary.shareCount),
      euro(getRemainingCostPerShare(summary))
    )
  )

  return lines.join('\n')
}

export function createSubscriptionsSummaryCards(
  infoCard: (title: string, value: string, help?: string) => unknown,
  totalShares: FixedSummaryValue,
  vestedShares: FixedSummaryValue,
  unvestedShares: FixedSummaryValue,
  currentDate: Date,
  texts: OsakkeetLocalization
) {
  const sharePercent = createSharePercentFormatter(totalShares)
  const referenceDate = formatDateLabel(currentDate)
  return [
    infoCard(texts.subscriptions.summary.totalShares, amount(totalShares)),
    infoCard(texts.subscriptions.summary.vestedSharesAtDate(referenceDate), sharePercent(vestedShares)),
    infoCard(texts.subscriptions.summary.unvestedSharesAtDate(referenceDate), sharePercent(unvestedShares)),
  ]
}
