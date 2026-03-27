import Decimal from 'decimal.js'
import { indexToYm, ymToIndex } from './kaukolampoBilling'
import type { UnpackedPowerUsage, YearMonth } from './kaukolampoTypes'

export function parseUnderscoreSeparatedYmNumbers(input: string): UnpackedPowerUsage {
  if (typeof input !== 'string') throw new TypeError('input must be a string')

  const tokens = input
    .split('_')
    .map((t) => t.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    throw new Error('input must contain at least a year-month anchor')
  }

  const ymRegex = /^(\d{4})-(\d{1,2})$/
  const first = tokens[0]
  const ymMatch = first.match(ymRegex)
  if (!ymMatch) {
    throw new Error(`first token must be year-month in form YYYY-M: got "${first}"`)
  }

  const year = Number(ymMatch[1])
  const month = Number(ymMatch[2])
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`invalid year-month anchor: "${first}"`)
  }

  const from: YearMonth = { year, month }
  let idx = ymToIndex(from)

  const numbers: Record<number, Decimal> = {}
  const numberTokens = tokens.slice(1)

  // If no number tokens, to defaults to from
  if (numberTokens.length === 0) {
    return { from, to: from, numbers }
  }

  for (const t of numberTokens) {
    const v = Decimal(t)
    if (!v.isFinite()) {
      throw new Error(`expected numeric token but got "${t}"`)
    }
    numbers[idx] = v
    idx += 1
  }

  const to = indexToYm(idx - 1) // last mapped month
  return { from, to, numbers }
}

export function formatAsUnderscoreSeparated(input: UnpackedPowerUsage): string {
  const { from, to, numbers } = input

  const fromIdx = ymToIndex(from)
  const toIdx = ymToIndex(to)

  if (toIdx < fromIdx) {
    throw new Error('to must be >= from')
  }

  const parts: string[] = []

  // First item: anchor
  parts.push(`${from.year}-${from.month}`)

  // Following items: numbers for each month
  for (let idx = fromIdx; idx <= toIdx; idx++) {
    const value = numbers[idx]
    if (value === undefined) {
      throw new Error(`Missing number for ${JSON.stringify(indexToYm(idx))}`)
    }
    parts.push(String(value))
  }

  return parts.join('_')
}
