import Decimal from 'decimal.js'
import {
  hasParsedTimestamp,
  parseEventTimestamp,
  type ParsedCapitalRepaymentOrDividend,
  type ParsedEvent,
  type ParsedEventTimestamp,
  type ParsedShareCalculatorInputs,
  type ParsedSubscription,
} from './osakkeetParsedData'
import {
  type ShareCalculatorLogEntry,
  type ShareCalculatorSellForThisSubscriptionLogEntry,
} from './shareCalculatorTypes'
import { parseSupportedTimestampOrDate } from './osakkeetUtils'

type ShareCalculatorRemainingValues = {
  shareCount: Decimal
  shareAcquisitionCost: Decimal
}

type ShareCalculatorLotState = {
  shareCount: Decimal
  shareAcquisitionCost: Decimal
  baseShareAcquisitionCost: Decimal
}

type ShareCalculatorResult = {
  remaining: ShareCalculatorRemainingValues
  log: ShareCalculatorLogEntry[]
}

export type ShareCalculator = {
  sellsForThisSubscriptionLotsBySubscriptionId: Record<string, ShareCalculatorSellForThisSubscriptionLogEntry[]>
  subscriptionIds: string[]
  getRemainingCountAndAcquisitionCost(shareSubscriptionId: string, timestamp: string | Date): ShareCalculatorResult
}

export type ShareCalculatorError = {
  kind: 'invalid_input' | 'timestamp_conflict' | 'sell_exceeds_available'
  message: string
}

type CreateShareCalculatorResult = {
  shareCalculator: ShareCalculator
  errors: ShareCalculatorError[]
}

type WorkingLotState = {
  id: string
  timestampMs: number
  date: string
  shareCount: Decimal
  shareAcquisitionCost: Decimal
  baseShareAcquisitionCost: Decimal
}

type ShareCalculatorInternalState = {
  logsBySubscriptionId: Map<string, ShareCalculatorLogEntry[]>
  sellsForThisSubscriptionLotsBySubscriptionId: Record<string, ShareCalculatorSellForThisSubscriptionLogEntry[]>
}

const zero = new Decimal(0)
const CAPITAL_REPAYMENT_ELIGIBILITY_YEARS = 10

function getTimestampConflictDescription(event: ParsedEvent) {
  return `${event.kind}:${event.id}:${event.date}`
}

function getDayConflictFamily(event: ParsedEvent) {
  switch (event.kind) {
    case 'subscription':
      return 'subscription'
    case 'sell':
      return 'sell'
    case 'capitalRepaymentOrDividend':
      return 'distribution'
    case 'shareCountChange':
    case 'acquisitionCostChange':
      return 'structure'
  }
}

function canShareDayWithoutTime(a: ParsedEvent, b: ParsedEvent) {
  return getDayConflictFamily(a) === getDayConflictFamily(b)
}

function collectTimestampConflicts(events: ParsedEvent[], errors: ShareCalculatorError[]) {
  const parsedEvents = events.filter(hasParsedTimestamp)
  const reportedPairs = new Set<string>()
  const reportConflict = (a: ParsedEvent, b: ParsedEvent) => {
    const descriptionA = getTimestampConflictDescription(a)
    const descriptionB = getTimestampConflictDescription(b)
    const pairKey = [descriptionA, descriptionB].sort().join('|')
    if (reportedPairs.has(pairKey)) return
    reportedPairs.add(pairKey)
    errors.push({
      kind: 'timestamp_conflict',
      message: `Timestamp conflict between ${descriptionA} and ${descriptionB}.`,
    })
  }

  const eventsByCalendarDay = new Map<string, (ParsedEvent & { parsedTimestamp: ParsedEventTimestamp })[]>()
  parsedEvents.forEach((event) => {
    const existing = eventsByCalendarDay.get(event.parsedTimestamp.calendarDayKey) || []
    eventsByCalendarDay.set(event.parsedTimestamp.calendarDayKey, [...existing, event])
  })

  eventsByCalendarDay.forEach((dayEvents) => {
    const sortedEvents = [...dayEvents].sort((a, b) => eventTimestampMs(a) - eventTimestampMs(b))
    for (let index = 0; index < sortedEvents.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < sortedEvents.length; nextIndex += 1) {
        const left = sortedEvents[index]
        const right = sortedEvents[nextIndex]
        const leftDayPrecision = !!left.parsedTimestamp.dayKey
        const rightDayPrecision = !!right.parsedTimestamp.dayKey
        const sameExactTimestamp = left.parsedTimestamp.timestampMs === right.parsedTimestamp.timestampMs

        if (!leftDayPrecision && !rightDayPrecision && !sameExactTimestamp) {
          continue
        }

        if (leftDayPrecision && rightDayPrecision && canShareDayWithoutTime(left, right)) {
          continue
        }

        if (sameExactTimestamp || leftDayPrecision || rightDayPrecision) {
          reportConflict(left, right)
        }
      }
    }
  })
}

function eventTimestampMs(event: ParsedEvent) {
  return event.parsedTimestamp?.timestampMs ?? Number.POSITIVE_INFINITY
}

function sortEvents(events: ParsedEvent[]) {
  return [...events].sort((a, b) => eventTimestampMs(a) - eventTimestampMs(b))
}

function createInitialState(subscription: ParsedSubscription): WorkingLotState {
  return {
    id: subscription.id,
    timestampMs: subscription.parsedTimestamp?.timestampMs ?? Number.NEGATIVE_INFINITY,
    date: subscription.date,
    shareCount: subscription.shareCount,
    shareAcquisitionCost: subscription.shareAcquisitionCost,
    baseShareAcquisitionCost: subscription.shareAcquisitionCost,
  }
}

function addYears(date: Date, years: number) {
  const next = new Date(date.getTime())
  next.setUTCFullYear(next.getUTCFullYear() + years)
  return next
}

function isCapitalRepaymentWithinAgeLimit(lot: WorkingLotState, event: ParsedCapitalRepaymentOrDividend) {
  if (event.type !== 'capital_return') return false
  const lotDate = new Date(lot.timestampMs)
  const eventDate = new Date(event.parsedTimestamp?.timestampMs ?? Number.NaN)
  if (Number.isNaN(lotDate.getTime()) || Number.isNaN(eventDate.getTime())) return false
  return eventDate.getTime() <= addYears(lotDate, CAPITAL_REPAYMENT_ELIGIBILITY_YEARS).getTime()
}

function getOrCreateLogBucket(logsBySubscriptionId: Map<string, ShareCalculatorLogEntry[]>, subscriptionId: string) {
  const existing = logsBySubscriptionId.get(subscriptionId)
  if (existing) return existing
  const next: ShareCalculatorLogEntry[] = []
  logsBySubscriptionId.set(subscriptionId, next)
  return next
}

function recordLogEntry(
  internalState: ShareCalculatorInternalState,
  subscriptionId: string,
  entry: ShareCalculatorLogEntry
) {
  getOrCreateLogBucket(internalState.logsBySubscriptionId, subscriptionId).push(entry)
  if (entry.kind === 'sellForThisSubscription') {
    const existing = internalState.sellsForThisSubscriptionLotsBySubscriptionId[subscriptionId] || []
    internalState.sellsForThisSubscriptionLotsBySubscriptionId[subscriptionId] = [...existing, entry]
  }
}

function processEvents(
  events: ParsedEvent[],
  errors: ShareCalculatorError[],
  options: { capitalReturnCutoffTimestampMs?: number; forceTreatCapitalReturnsAsDividends?: boolean } = {}
) {
  const internalState: ShareCalculatorInternalState = {
    logsBySubscriptionId: new Map(),
    sellsForThisSubscriptionLotsBySubscriptionId: {},
  }
  const lotOrder: string[] = []
  const lotsById = new Map<string, WorkingLotState>()

  for (const event of sortEvents(events)) {
    if (event.kind === 'subscription') {
      if (!event.parsedTimestamp) continue
      const lot = createInitialState(event)
      lotsById.set(event.id, lot)
      lotOrder.push(event.id)
      recordLogEntry(internalState, event.id, {
        kind: 'subscription',
        id: event.id,
        date: event.date,
        shareCount: lot.shareCount,
        shareAcquisitionCost: lot.shareAcquisitionCost,
        originalSharePrice: event.originalSharePrice,
        remainingAfter: {
          shareCount: lot.shareCount,
          shareAcquisitionCost: lot.shareAcquisitionCost,
        },
      })
      continue
    }

    if (!event.parsedTimestamp) continue
    const currentEventTimestampMs = event.parsedTimestamp.timestampMs

    if (event.kind === 'shareCountChange') {
      for (const subscriptionId of lotOrder) {
        const lot = lotsById.get(subscriptionId)
        if (!lot || lot.timestampMs > currentEventTimestampMs) continue
        const beforeShareCount = lot.shareCount
        const nextShareCount = lot.shareCount.mul(event.shareCountMultiplier)
        if (nextShareCount.eq(beforeShareCount)) continue
        lot.shareCount = nextShareCount
        recordLogEntry(internalState, subscriptionId, {
          kind: 'companyShareCountChange',
          id: subscriptionId,
          changeId: event.id,
          date: event.date,
          type: 'share_split',
          shareCountMultiplier: event.shareCountMultiplier,
          remainingAfter: {
            shareCount: lot.shareCount,
            shareAcquisitionCost: lot.shareAcquisitionCost,
          },
        })
      }
      continue
    }

    if (event.kind === 'acquisitionCostChange') {
      for (const subscriptionId of lotOrder) {
        const lot = lotsById.get(subscriptionId)
        if (!lot || lot.timestampMs > currentEventTimestampMs) continue
        const beforeShareAcquisitionCost = lot.shareAcquisitionCost
        const beforeBaseShareAcquisitionCost = lot.baseShareAcquisitionCost
        const nextShareAcquisitionCost = lot.shareAcquisitionCost.mul(event.shareAcquisitionCostMultiplier)
        const nextBaseShareAcquisitionCost = lot.baseShareAcquisitionCost.mul(event.shareAcquisitionCostMultiplier)
        if (
          nextShareAcquisitionCost.eq(beforeShareAcquisitionCost) &&
          nextBaseShareAcquisitionCost.eq(beforeBaseShareAcquisitionCost)
        ) {
          continue
        }
        lot.shareAcquisitionCost = nextShareAcquisitionCost
        lot.baseShareAcquisitionCost = nextBaseShareAcquisitionCost
        recordLogEntry(internalState, subscriptionId, {
          kind: 'companyAcquisitionCostChange',
          id: subscriptionId,
          changeId: event.id,
          date: event.date,
          type: 'demerger',
          shareAcquisitionCostMultiplier: event.shareAcquisitionCostMultiplier,
          remainingAfter: {
            shareCount: lot.shareCount,
            shareAcquisitionCost: lot.shareAcquisitionCost,
          },
        })
      }
      continue
    }

    if (event.kind === 'capitalRepaymentOrDividend') {
      if (event.type === 'dividend') {
        for (const subscriptionId of lotOrder) {
          const lot = lotsById.get(subscriptionId)
          if (!lot || lot.timestampMs > currentEventTimestampMs) continue
          const beforeShareCount = lot.shareCount
          if (beforeShareCount.lte(0)) continue
          recordLogEntry(internalState, subscriptionId, {
            kind: 'dividend',
            id: subscriptionId,
            dividendId: event.id,
            date: event.date,
            amountPerShare: event.amountPerShare,
            shareCountAtEvent: beforeShareCount,
            dividendTotal: event.amountPerShare.mul(beforeShareCount),
            remainingAfter: {
              shareCount: lot.shareCount,
              shareAcquisitionCost: lot.shareAcquisitionCost,
            },
          })
        }
        continue
      }
      for (const subscriptionId of lotOrder) {
        const lot = lotsById.get(subscriptionId)
        if (!lot || lot.timestampMs > currentEventTimestampMs) continue
        const beforeShareCount = lot.shareCount
        if (beforeShareCount.lte(0)) continue
        const isPastCutoff =
          options.forceTreatCapitalReturnsAsDividends ||
          (options.capitalReturnCutoffTimestampMs != null &&
            !Number.isNaN(options.capitalReturnCutoffTimestampMs) &&
            currentEventTimestampMs >= options.capitalReturnCutoffTimestampMs)
        const isEligibleByAge = isCapitalRepaymentWithinAgeLimit(lot, event)
        const remainingPerShare = lot.shareCount.gt(0) ? lot.shareAcquisitionCost.div(lot.shareCount) : zero
        const capitalRepaymentPerShare =
          !isPastCutoff && isEligibleByAge && lot.shareAcquisitionCost.gt(0)
            ? Decimal.min(event.amountPerShare, remainingPerShare)
            : zero
        const appliedShareAcquisitionCost = capitalRepaymentPerShare.mul(beforeShareCount)
        const grossTotal = event.amountPerShare.mul(beforeShareCount)
        const directedToDividendTotal = Decimal.max(grossTotal.minus(appliedShareAcquisitionCost), zero)
        const dividendReason = isPastCutoff
          ? 'listed_dividend'
          : !isEligibleByAge
            ? 'too_old'
            : directedToDividendTotal.gt(0)
              ? lot.shareAcquisitionCost.lte(0)
                ? 'no_remaining_cost'
                : 'remaining_cost_limit'
              : undefined
        if (appliedShareAcquisitionCost.gt(0)) {
          lot.shareAcquisitionCost = Decimal.max(lot.shareAcquisitionCost.minus(appliedShareAcquisitionCost), zero)
        }
        recordLogEntry(internalState, subscriptionId, {
          kind: 'capitalRepayment',
          id: subscriptionId,
          capitalRepaymentId: event.id,
          date: event.date,
          amountPerShare: event.amountPerShare,
          shareCountAtEvent: beforeShareCount,
          appliedShareAcquisitionCost,
          directedToDividendTotal,
          dividendReason,
          remainingAfter: {
            shareCount: lot.shareCount,
            shareAcquisitionCost: lot.shareAcquisitionCost,
          },
        })
      }
      continue
    }

    if (event.kind === 'sell') {
      let remainingToSell = event.shareCount

      for (const subscriptionId of lotOrder) {
        if (remainingToSell.lte(0)) break
        const lot = lotsById.get(subscriptionId)
        if (!lot || lot.timestampMs > currentEventTimestampMs || lot.shareCount.lte(0)) continue

        const soldShareCount = Decimal.min(lot.shareCount, remainingToSell)
        if (soldShareCount.lte(0)) continue

        const beforeShareCount = lot.shareCount
        const beforeShareAcquisitionCost = lot.shareAcquisitionCost
        const beforeBaseShareAcquisitionCost = lot.baseShareAcquisitionCost
        const soldShareAcquisitionCost = beforeShareCount.gt(0)
          ? beforeShareAcquisitionCost.mul(soldShareCount).div(beforeShareCount)
          : zero
        const soldBaseShareAcquisitionCost = beforeShareCount.gt(0)
          ? beforeBaseShareAcquisitionCost.mul(soldShareCount).div(beforeShareCount)
          : zero

        lot.shareCount = Decimal.max(lot.shareCount.minus(soldShareCount), zero)
        lot.shareAcquisitionCost = Decimal.max(lot.shareAcquisitionCost.minus(soldShareAcquisitionCost), zero)
        lot.baseShareAcquisitionCost = Decimal.max(
          lot.baseShareAcquisitionCost.minus(soldBaseShareAcquisitionCost),
          zero
        )

        recordLogEntry(internalState, subscriptionId, {
          kind: 'sellForThisSubscription',
          id: subscriptionId,
          sellId: event.id,
          date: event.date,
          soldShareCount,
          soldShareAcquisitionCost,
          soldBaseShareAcquisitionCost,
          sellPrice: event.shareCount.gt(0) ? event.sellPrice.mul(soldShareCount).div(event.shareCount) : zero,
          pricePerShare: event.pricePerShare,
          remainingAfter: {
            shareCount: lot.shareCount,
            shareAcquisitionCost: lot.shareAcquisitionCost,
          },
        })

        remainingToSell = remainingToSell.minus(soldShareCount)
      }

      if (remainingToSell.gt(0)) {
        errors.push({
          kind: 'sell_exceeds_available',
          message: `Sell ${event.id} exceeds available shares by ${remainingToSell.toString()}.`,
        })
      }
    }
  }

  return internalState
}

function compareLogEntryTimestamp(a: ShareCalculatorLogEntry, b: ShareCalculatorLogEntry) {
  const parsedA = parseEventTimestamp(a.date)
  const parsedB = parseEventTimestamp(b.date)
  return (parsedA?.timestampMs ?? 0) - (parsedB?.timestampMs ?? 0)
}

function resolveStateFromLogEntries(
  log: ShareCalculatorLogEntry[],
  timestampMs: number,
  inclusive: boolean,
  includeLog = true
) {
  let state: ShareCalculatorLotState = {
    shareCount: zero,
    shareAcquisitionCost: zero,
    baseShareAcquisitionCost: zero,
  }
  const filtered: ShareCalculatorLogEntry[] = []
  for (const entry of [...log].sort(compareLogEntryTimestamp)) {
    const parsed = parseEventTimestamp(entry.date)
    if (!parsed) continue
    const include = inclusive ? parsed.timestampMs <= timestampMs : parsed.timestampMs < timestampMs
    if (!include) continue
    if (includeLog) filtered.push(entry)
    if (entry.kind === 'subscription') {
      state = {
        shareCount: entry.remainingAfter.shareCount,
        shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
        baseShareAcquisitionCost: entry.shareAcquisitionCost,
      }
      continue
    }
    if (entry.kind === 'companyAcquisitionCostChange') {
      const multiplier = entry.shareAcquisitionCostMultiplier
      state = {
        shareCount: entry.remainingAfter.shareCount,
        shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
        baseShareAcquisitionCost: state.baseShareAcquisitionCost.mul(multiplier),
      }
      continue
    }
    if (entry.kind === 'sellForThisSubscription') {
      state = {
        shareCount: entry.remainingAfter.shareCount,
        shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
        baseShareAcquisitionCost: Decimal.max(
          state.baseShareAcquisitionCost.minus(entry.soldBaseShareAcquisitionCost),
          zero
        ),
      }
      continue
    }
    state = {
      shareCount: entry.remainingAfter.shareCount,
      shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
      baseShareAcquisitionCost: state.baseShareAcquisitionCost,
    }
  }

  return {
    remaining: {
      shareCount: state.shareCount,
      shareAcquisitionCost: state.shareAcquisitionCost,
    },
    state,
    log: filtered,
  }
}

type ShareCalculatorOptions = {
  capitalReturnCutoffDateExclusive?: string | Date
  forceTreatCapitalReturnsAsDividends?: boolean
}

export function createShareCalculator(
  inputs: ParsedShareCalculatorInputs,
  options: ShareCalculatorOptions = {}
): CreateShareCalculatorResult {
  const errors: ShareCalculatorError[] = []
  const capitalReturnCutoffTimestampMs =
    typeof options.capitalReturnCutoffDateExclusive === 'string'
      ? parseSupportedTimestampOrDate(options.capitalReturnCutoffDateExclusive.trim())?.getTime()
      : options.capitalReturnCutoffDateExclusive?.getTime()
  const parsedEvents = [
    ...inputs.subscriptions,
    ...inputs.sells,
    ...inputs.shareSplits,
    ...inputs.demergers,
    ...inputs.cashDistributions,
  ].filter(hasParsedTimestamp)

  collectTimestampConflicts(parsedEvents, errors)

  const internalState = processEvents(parsedEvents, errors, {
    capitalReturnCutoffTimestampMs,
    forceTreatCapitalReturnsAsDividends: options.forceTreatCapitalReturnsAsDividends,
  })

  const shareCalculator: ShareCalculator = {
    sellsForThisSubscriptionLotsBySubscriptionId: internalState.sellsForThisSubscriptionLotsBySubscriptionId,
    subscriptionIds: inputs.subscriptions.map((subscription) => subscription.id),
    getRemainingCountAndAcquisitionCost(shareSubscriptionId: string, timestamp: string | Date): ShareCalculatorResult {
      const normalized = typeof timestamp === 'string' ? parseSupportedTimestampOrDate(timestamp.trim()) : timestamp
      const timestampMs = normalized?.getTime()
      if (!normalized || Number.isNaN(timestampMs)) {
        return {
          remaining: { shareCount: zero, shareAcquisitionCost: zero },
          log: [],
        }
      }
      const log = internalState.logsBySubscriptionId.get(shareSubscriptionId) || []
      const resolved = resolveStateFromLogEntries(log, timestampMs!, true)
      return { remaining: resolved.remaining, log: resolved.log }
    },
  }

  return { shareCalculator, errors }
}
