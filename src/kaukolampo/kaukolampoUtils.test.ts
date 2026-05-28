import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { printMoney, printPower } from './formatting'
import { ymToIndex } from './kaukolampoBilling'
import { formatAsUnderscoreSeparated, parseUnderscoreSeparatedYmNumbers } from './powerUsageString'
import { range } from './range'
import { shortHexHash, toDate } from './util'
import { calculateViivastyskorkoMultiplier, type RatePeriod } from './viivastyskorko'

function expectDecimal(actual: Decimal, expected: string) {
  expect(actual.toString()).toBe(expected)
}

describe(range, () => {
  it('builds an inclusive range', () => {
    expect(range(3, 6)).toEqual([3, 4, 5, 6])
  })

  it('returns an empty range when the end is before the start', () => {
    expect(range(2, 1)).toEqual([])
  })
})

describe(parseUnderscoreSeparatedYmNumbers, () => {
  it('parses an anchor month and subsequent values across a year boundary', () => {
    const parsed = parseUnderscoreSeparatedYmNumbers('2024-12_ 1.5 _ 2 _ 3.25 ')

    expect(parsed.from).toEqual({ year: 2024, month: 12 })
    expect(parsed.to).toEqual({ year: 2025, month: 2 })
    expectDecimal(parsed.numbers[ymToIndex({ year: 2024, month: 12 })], '1.5')
    expectDecimal(parsed.numbers[ymToIndex({ year: 2025, month: 1 })], '2')
    expectDecimal(parsed.numbers[ymToIndex({ year: 2025, month: 2 })], '3.25')
  })

  it('accepts an input with only the anchor month', () => {
    const parsed = parseUnderscoreSeparatedYmNumbers('2025-7')

    expect(parsed.from).toEqual({ year: 2025, month: 7 })
    expect(parsed.to).toEqual({ year: 2025, month: 7 })
    expect(parsed.numbers).toEqual({})
  })

  it('rejects invalid anchors and numeric tokens', () => {
    expect(() => parseUnderscoreSeparatedYmNumbers('not-a-month_1')).toThrow(/first token must be year-month/i)
    expect(() => parseUnderscoreSeparatedYmNumbers('2025-13_1')).toThrow(/invalid year-month anchor/i)
    expect(() => parseUnderscoreSeparatedYmNumbers('2025-7_not-a-number')).toThrow()
  })
})

describe(formatAsUnderscoreSeparated, () => {
  it('formats consecutive monthly values into the shareable underscore format', () => {
    const formatted = formatAsUnderscoreSeparated({
      from: { year: 2024, month: 12 },
      to: { year: 2025, month: 2 },
      numbers: {
        [ymToIndex({ year: 2024, month: 12 })]: Decimal('1.5'),
        [ymToIndex({ year: 2025, month: 1 })]: Decimal('2'),
        [ymToIndex({ year: 2025, month: 2 })]: Decimal('3.25'),
      },
    })

    expect(formatted).toBe('2024-12_1.5_2_3.25')
  })

  it('rejects invalid ranges and missing month values', () => {
    expect(() =>
      formatAsUnderscoreSeparated({
        from: { year: 2025, month: 2 },
        to: { year: 2025, month: 1 },
        numbers: {},
      })
    ).toThrow(/to must be >= from/i)

    expect(() =>
      formatAsUnderscoreSeparated({
        from: { year: 2025, month: 1 },
        to: { year: 2025, month: 2 },
        numbers: {
          [ymToIndex({ year: 2025, month: 1 })]: Decimal(1),
        },
      })
    ).toThrow(/Missing number/i)
  })
})

describe('formatting and utility helpers', () => {
  it('prints power and money with fixed precision', () => {
    expect(printPower(Decimal('1.23456'))).toBe('1.235')
    expect(printMoney(Decimal('1.2'))).toBe('1.20')
  })

  it('creates UTC dates from year month day values', () => {
    expect(toDate(2025, 2, 3).toISOString()).toBe('2025-02-03T00:00:00.000Z')
  })

  it('creates a sha256 hex hash and supports truncation', async () => {
    await expect(shortHexHash('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
    await expect(shortHexHash('abc', 8)).resolves.toBe('ba7816bf')
  })

  it('rejects invalid hash lengths', async () => {
    await expect(shortHexHash('abc', -1)).rejects.toThrow(/between 0 and 64/i)
    await expect(shortHexHash('abc', 65)).rejects.toThrow(/between 0 and 64/i)
  })
})

describe(calculateViivastyskorkoMultiplier, () => {
  const periods: RatePeriod[] = [
    {
      from: '2025-01-01',
      invalidOn: '2025-01-10',
      personAnnualRate: 0.1,
      companyAnnualRate: 0.2,
    },
    {
      from: '2025-01-10',
      invalidOn: '2025-01-20',
      personAnnualRate: 0.05,
      companyAnnualRate: 0.15,
    },
  ]

  it('returns the identity multiplier when the end is not after the start', () => {
    const sameDay = calculateViivastyskorkoMultiplier(
      new Date('2025-01-05T00:00:00Z'),
      new Date('2025-01-05T00:00:00Z'),
      true,
      periods
    )

    expectDecimal(sameDay.multiplier, '1')
    expect(sameDay.segments).toEqual([])
  })

  it('splits company interest across overlapping periods', () => {
    const result = calculateViivastyskorkoMultiplier(
      new Date('2025-01-05T00:00:00Z'),
      new Date('2025-01-12T00:00:00Z'),
      true,
      periods
    )

    expect(result.company).toBe(true)
    expect(result.segments).toHaveLength(2)
    expect(result.segments.map((segment) => segment.days)).toEqual([5, 2])
    expect(result.segments.map((segment) => segment.annual.toFixed(2))).toEqual(['0.20', '0.15'])
    expect(result.multiplier.toFixed(12)).toBe('1.003563895665')
  })

  it('uses person rates when requested', () => {
    const result = calculateViivastyskorkoMultiplier(
      new Date('2025-01-10T00:00:00Z'),
      new Date('2025-01-12T00:00:00Z'),
      false,
      periods
    )

    expect(result.segments).toHaveLength(1)
    expect(result.segments[0].days).toBe(2)
    expect(result.segments[0].annual.toFixed(2)).toBe('0.05')
    expect(result.multiplier.toFixed(12)).toBe('1.000273972603')
  })
})
