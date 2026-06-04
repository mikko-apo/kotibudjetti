type FixedValue = {
  toFixed: (precision?: number) => string
}

type Language = 'fi' | 'en'
type SharePercentValue = FixedValue & {
  gt: (value: number) => boolean
  div: (value: any) => SharePercentValue
  mul: (value: number) => SharePercentValue
}

export function euro(value: FixedValue) {
  return `${value.toFixed(2)}\u00A0€`
}

export function amount(value: FixedValue) {
  return value.toFixed(2)
}

export function percentage(value: FixedValue) {
  return `${value.toFixed(2)} %`
}

export function multiplier(value: FixedValue) {
  return `${value.toFixed(2)}x`
}

export function formatLastModifiedTimestamp(value: string | undefined, languageSelection: Language, fallback: string) {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat(languageSelection === 'fi' ? 'fi-FI' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(parsed)
}

export function formatDateLabel(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}.${month}.${year}`
}

export function createSharePercentFormatter(totalShares: SharePercentValue) {
  return (value: SharePercentValue) =>
    totalShares.gt(0)
      ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})`
      : `${amount(value)} (0.00 %)`
}

export const createSharePercent = createSharePercentFormatter
