// add (or subtract with negative) days to an ISO YYYY-MM-DD date
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

// is `date` (YYYY-MM-DD) inside any pause range?
// a pause covers [startDate, endDate]; endDate=null means open-ended (still paused)
export function isInPause(
  date: string,
  pauses: { startDate: string; endDate: string | null }[]
): boolean {
  return pauses.some((p) => p.startDate <= date && (p.endDate === null || date <= p.endDate))
}
