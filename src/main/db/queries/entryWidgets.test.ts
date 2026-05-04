import { DrizzleDB } from '../database'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { createEntry } from './entries'
import { getWidgetsForEntry } from './entryWidgets'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getWidgetsForEntry', () => {
  it('returns empty array when no entryId matches', () => {
    const matchingWidgets = getWidgetsForEntry(db, 999)

    expect(matchingWidgets).toEqual([])
  })

  it('returns only widgets for the specific entry', () => {
    createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createEntry(db, '2026-05-03', 'Entry 2')

    const matchingWidgets = getWidgetsForEntry(db, entry2.id)

    expect(matchingWidgets.length).toBeGreaterThan(0)
    expect(matchingWidgets.every((widget) => widget.entryId === entry2.id)).toBe(true)
  })

  it('orders widgets by position ascending', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const matchingWidgets = getWidgetsForEntry(db, entry.id)

    expect(matchingWidgets.length).toBeGreaterThan(0)
    expect(matchingWidgets.map((widget) => widget.position)).toEqual(
      matchingWidgets.map((widget) => widget.position).sort((a, b) => a - b)
    )
  })
})
