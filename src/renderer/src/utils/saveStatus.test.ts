import { describe, it, expect } from 'vitest'
import { formatSavedAgo } from './saveStatus'

describe('formatSavedAgo', () => {
  const now = new Date('2026-05-10T12:00:00Z')

  it('returns null when never saved', () => {
    expect(formatSavedAgo(null, now)).toBeNull()
  })

  it('returns "Saved just now" within 5 seconds', () => {
    const at = new Date(now.getTime() - 2_000)
    expect(formatSavedAgo(at, now)).toBe('Saved just now')
  })

  it('returns "Saved 30s ago" for sub-minute deltas', () => {
    const at = new Date(now.getTime() - 30_000)
    expect(formatSavedAgo(at, now)).toBe('Saved 30s ago')
  })

  it('returns "Saved 1m ago" right at the minute mark', () => {
    const at = new Date(now.getTime() - 60_000)
    expect(formatSavedAgo(at, now)).toBe('Saved 1m ago')
  })

  it('returns "Saved 5m ago" for a 5-minute-old save', () => {
    const at = new Date(now.getTime() - 5 * 60_000)
    expect(formatSavedAgo(at, now)).toBe('Saved 5m ago')
  })

  it('returns "Saved 2h ago" for hour-old saves', () => {
    const at = new Date(now.getTime() - 2 * 60 * 60_000)
    expect(formatSavedAgo(at, now)).toBe('Saved 2h ago')
  })

  it('falls back to a calendar date past 24h', () => {
    const at = new Date(now.getTime() - 25 * 60 * 60_000)
    const result = formatSavedAgo(at, now)
    expect(result).toMatch(/^Saved /)
    expect(result).not.toMatch(/ago$/)
  })

  it('clamps negative deltas (clock skew) to "just now"', () => {
    const at = new Date(now.getTime() + 5_000) // future timestamp
    expect(formatSavedAgo(at, now)).toBe('Saved just now')
  })
})
