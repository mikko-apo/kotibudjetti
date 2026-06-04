import Decimal from 'decimal.js'

export function parseSupportedDate(trimmed: string) {
  const finnishDateMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

  if (finnishDateMatch) {
    const [, day, month, year] = finnishDateMatch
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }
  if (isoDateMatch) {
    return new Date(`${trimmed}T00:00:00Z`)
  }
  return undefined
}

export function parseSupportedTimestampOrDate(trimmed: string) {
  const parsedDate = parseSupportedDate(trimmed)
  if (parsedDate) return parsedDate

  const isoTimestampMatch = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed)
  if (!isoTimestampMatch) return undefined

  const parsedTimestamp = new Date(trimmed)
  return Number.isNaN(parsedTimestamp.getTime()) ? undefined : parsedTimestamp
}

export function compareDateStrings(a: string, b: string) {
  const dateA = parseSupportedTimestampOrDate(a.trim())
  const dateB = parseSupportedTimestampOrDate(b.trim())
  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime()
  }
  if (dateA) return -1
  if (dateB) return 1
  return a.localeCompare(b)
}

export function sortRowsByDate<TRow extends { date: string }>(rows: readonly TRow[]) {
  return [...rows].sort((a, b) => compareDateStrings(a.date, b.date))
}

export function sumDecimals(values: Decimal[]) {
  return values.reduce((acc, value) => acc.add(value), new Decimal(0))
}

function addYears(date: Date, years: number) {
  const next = new Date(date.getTime())
  next.setUTCFullYear(next.getUTCFullYear() + years)
  return next
}

export function isWithinYearsInclusive(start?: Date, end?: Date, years = 10) {
  if (!start || !end) return false
  return end.getTime() <= addYears(start, years).getTime()
}

export function isAtLeastYears(start?: Date, end?: Date, years = 10) {
  if (!start || !end) return false
  return end.getTime() >= addYears(start, years).getTime()
}
