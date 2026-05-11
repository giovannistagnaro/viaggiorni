import { describe, it, expect } from 'vitest'
import { pickByDate } from './pickByDate'

describe('pickByDate', () => {
  const items = ['a', 'b', 'c', 'd', 'e']

  it('is deterministic for the same (date, salt) pair', () => {
    const a = pickByDate('2026-05-10', 'washi', items)
    const b = pickByDate('2026-05-10', 'washi', items)
    expect(a).toBe(b)
  })

  it('returns different picks for different salts on the same date', () => {
    // With 5 items and good distribution, two distinct salts pick different
    // items most of the time. Collect across a few salts to assert variety.
    const picks = new Set(
      ['washi', 'paper', 'stamp', 'stencil', 'postmark'].map((s) =>
        pickByDate('2026-05-10', s, items)
      )
    )
    expect(picks.size).toBeGreaterThan(1)
  })

  it('returns different picks across different dates', () => {
    const picks = new Set(
      ['2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14'].map((d) =>
        pickByDate(d, 'washi', items)
      )
    )
    expect(picks.size).toBeGreaterThan(1)
  })

  it('throws on an empty items array', () => {
    expect(() => pickByDate('2026-05-10', 'washi', [])).toThrow()
  })

  it('returns the only element when the array has length 1', () => {
    expect(pickByDate('2026-05-10', 'washi', ['only'])).toBe('only')
  })
})
