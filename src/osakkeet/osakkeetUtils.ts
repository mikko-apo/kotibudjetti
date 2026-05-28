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

export function compareDateStrings(a: string, b: string) {
  const dateA = parseSupportedDate(a.trim())
  const dateB = parseSupportedDate(b.trim())
  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime()
  }
  if (dateA) return -1
  if (dateB) return 1
  return a.localeCompare(b)
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
