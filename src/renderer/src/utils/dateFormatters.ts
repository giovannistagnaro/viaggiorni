export function formatDateISO(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

export function formatTitleForDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}
