import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { amount, euro, multiplier, percentage } from './osakkeetFormat'
import {
  compareDateStrings,
  isAtLeastYears,
  isWithinYearsInclusive,
  parseSupportedDate,
  parseSupportedTimestampOrDate,
  sumDecimals,
} from './osakkeetUtils'

describe(parseSupportedDate, () => {
  it('parses Finnish and ISO date formats as UTC dates', () => {
    expect(parseSupportedDate('1.2.2025')?.toISOString()).toBe('2025-02-01T00:00:00.000Z')
    expect(parseSupportedDate('2025-02-03')?.toISOString()).toBe('2025-02-03T00:00:00.000Z')
  })

  it('returns undefined for unsupported dates', () => {
    expect(parseSupportedDate('2025/02/03')).toBeUndefined()
  })
})

describe(parseSupportedTimestampOrDate, () => {
  it('parses supported ISO timestamps with timezone offsets', () => {
    expect(parseSupportedTimestampOrDate('2025-02-03T10:15:30Z')?.toISOString()).toBe('2025-02-03T10:15:30.000Z')
    expect(parseSupportedTimestampOrDate('2025-02-03T12:15:30+02:00')?.toISOString()).toBe('2025-02-03T10:15:30.000Z')
  })

  it('returns undefined for unsupported timestamp formats', () => {
    expect(parseSupportedTimestampOrDate('2025-02-03 10:15:30')).toBeUndefined()
  })
})

describe(compareDateStrings, () => {
  it('compares supported date formats chronologically', () => {
    expect(compareDateStrings('2025-02-03', '4.2.2025')).toBeLessThan(0)
    expect(compareDateStrings('4.2.2025', '2025-02-03')).toBeGreaterThan(0)
  })

  it('sorts supported dates before unsupported strings and falls back to lexical compare', () => {
    expect(compareDateStrings('2025-02-03', 'not-a-date')).toBeLessThan(0)
    expect(compareDateStrings('not-a-date', '2025-02-03')).toBeGreaterThan(0)
    expect(compareDateStrings('bbb', 'aaa')).toBeGreaterThan(0)
  })
})

describe('numeric and year-span helpers', () => {
  it('sums decimals exactly', () => {
    expect(sumDecimals([Decimal('1.25'), Decimal('2.75'), Decimal('-0.5')]).toString()).toBe('3.5')
  })

  it('treats the year boundary as inclusive for within and at-least checks', () => {
    const start = new Date('2015-05-29T00:00:00Z')
    const boundary = new Date('2025-05-29T00:00:00Z')
    const afterBoundary = new Date('2025-05-30T00:00:00Z')

    expect(isWithinYearsInclusive(start, boundary, 10)).toBe(true)
    expect(isWithinYearsInclusive(start, afterBoundary, 10)).toBe(false)
    expect(isAtLeastYears(start, boundary, 10)).toBe(true)
    expect(isAtLeastYears(start, new Date('2025-05-28T00:00:00Z'), 10)).toBe(false)
  })

  it('returns false when a year-span comparison is missing either side', () => {
    expect(isWithinYearsInclusive(undefined, new Date(), 10)).toBe(false)
    expect(isAtLeastYears(new Date(), undefined, 10)).toBe(false)
  })
})

describe('formatters', () => {
  const fixed = {
    toFixed(precision = 0) {
      return Decimal('12.3456').toFixed(precision)
    },
  }

  it('formats euro values, amounts, percentages, and multipliers', () => {
    expect(euro(fixed)).toBe('12.35\u00A0€')
    expect(amount(fixed)).toBe('12.35')
    expect(percentage(fixed)).toBe('12.35 %')
    expect(multiplier(fixed)).toBe('12.35x')
  })
})
