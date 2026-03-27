import Decimal from 'decimal.js'

export interface RatePeriod {
  from: string // ISO date, inclusive, e.g. "2025-07-01"
  invalidOn: string // ISO date, exclusive, e.g. "2026-01-01"
  personAnnualRate: number // e.g. 0.095 for 9.5%
  companyAnnualRate: number // e.g. 0.105 for 10.5%
}

export const HARD_CODED_PERIODS: RatePeriod[] = [
  {
    from: '2024-01-01',
    invalidOn: '2024-07-01',
    personAnnualRate: 0.115,
    companyAnnualRate: 0.125,
  },
  {
    from: '2024-07-01',
    invalidOn: '2025-01-01',
    personAnnualRate: 0.115, // 11.5%
    companyAnnualRate: 0.125, // 12.5%
  },
  {
    from: '2025-01-01',
    invalidOn: '2025-07-01',
    personAnnualRate: 0.105, // 10.5%
    companyAnnualRate: 0.115, // 11.5%
  },
  {
    from: '2025-07-01',
    invalidOn: '2026-01-01',
    personAnnualRate: 0.095, // 9.5%
    companyAnnualRate: 0.105, // 10.5%
  },
  {
    from: '2026-01-01',
    invalidOn: '2026-07-01',
    personAnnualRate: 0.095, // 9.5%
    companyAnnualRate: 0.105, // 10.5%
  },
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toDateISO(s: string) {
  return new Date(s + 'T00:00:00Z')
} // treat as UTC midnight
function daysBetweenInclusiveExclusive(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)
}

type MultiplierSegmentInfo = {
  start: Date
  end: Date
  annual: Decimal
  days: number
  multiplier: Decimal
}
type ViivastyskorkoMultiplier = {
  multiplier: Decimal
  company: boolean
  segments: MultiplierSegmentInfo[]
}

export function calculateViivastyskorkoMultiplier(
  startDate: Date,
  endDate: Date,
  company: boolean,
  periods: RatePeriod[] = HARD_CODED_PERIODS
): ViivastyskorkoMultiplier {
  let multiplier = Decimal(1)

  if (endDate <= startDate) return { multiplier, company, segments: [] }

  const segments: MultiplierSegmentInfo[] = []

  for (const p of periods) {
    const periodStart = toDateISO(p.from)
    const periodEnd = toDateISO(p.invalidOn)

    // overlap: max(startDate, periodStart) .. min(endDate, periodEnd)
    const segStart = startDate > periodStart ? startDate : periodStart
    const segEnd = endDate < periodEnd ? endDate : periodEnd

    if (segEnd <= segStart) continue

    const days = daysBetweenInclusiveExclusive(segStart, segEnd)
    const annual = Decimal(company ? p.companyAnnualRate : p.personAnnualRate)
    const daily = Decimal(annual).div(365)
    const segmentInterest = daily.mul(days).plus(1)
    multiplier = multiplier.mul(segmentInterest)
    segments.push({ start: segStart, end: segEnd, annual, days, multiplier: segmentInterest })
  }

  return { multiplier, company, segments }
}
