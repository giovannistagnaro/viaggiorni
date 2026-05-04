import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb, closeTestDb } from './testHelper'
import {
  createEntry,
  getEntryByDate,
  updateEntryTitle,
  toggleBookmark,
  getAllBookmarkedEntries
} from './entries'
import { entries, entryWritings, entryWidgets, templateWritings, templateWidgets } from '../schema'
import type { DrizzleDB } from '../database'
import { eq } from 'drizzle-orm'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getEntryByDate', () => {
  it('returns null when no entry exists for that date', () => {
    const result = getEntryByDate(db, '2026-05-02')

    expect(result).toBeNull()
  })

  it('returns the entry when one exists for that date', () => {
    db.insert(entries).values({ title: 'Test entry', date: '2026-05-02' }).run()

    const result = getEntryByDate(db, '2026-05-02')

    expect(result).not.toBeNull()
    expect(result?.title).toBe('Test entry')
    expect(result?.date).toBe('2026-05-02')
  })
})

describe('createEntry', () => {
  it('returns an entry with the correct title and date', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Test entry')

    expect(newEntry.title).toEqual('Test entry')
    expect(newEntry.date).toEqual('2026-05-02')
  })

  it('snapshots template_writings into entry_writings', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Test entry')

    const writings = db
      .select()
      .from(entryWritings)
      .where(eq(entryWritings.entryId, newEntry.id))
      .all()

    const templateWritingRows = db.select().from(templateWritings).all()

    expect(writings).toHaveLength(templateWritingRows.length)
    expect(writings.map((w) => w.type).sort()).toEqual(
      templateWritingRows.map((w) => w.type).sort()
    )
  })

  it('snapshots template_widgets into entry_widgets', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Test entry')

    const widgets = db
      .select()
      .from(entryWidgets)
      .where(eq(entryWidgets.entryId, newEntry.id))
      .all()

    const templateWidgetRows = db.select().from(templateWidgets).all()

    expect(widgets).toHaveLength(templateWidgetRows.length)
    expect(widgets.map((w) => w.type).sort()).toEqual(templateWidgetRows.map((w) => w.type).sort())
  })

  it('subsequent template changes do not affect existing entries', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Test entry')

    const writings = db
      .select()
      .from(entryWritings)
      .where(eq(entryWritings.entryId, newEntry.id))
      .all()

    db.delete(templateWritings).run()

    const writingsAfterDeletion = db
      .select()
      .from(entryWritings)
      .where(eq(entryWritings.entryId, newEntry.id))
      .all()

    expect(writingsAfterDeletion).toHaveLength(writings.length)
    expect(writingsAfterDeletion.map((w) => w.type).sort()).toEqual(
      writings.map((w) => w.type).sort()
    )
  })
})

describe('updateEntryTitle', () => {
  it('updates the title of an existing entry', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Original')
    updateEntryTitle(db, newEntry.id, 'Updated')

    const updatedTitle = db
      .select({ title: entries.title })
      .from(entries)
      .where(eq(entries.id, newEntry.id))
      .get()?.title

    expect(updatedTitle).toEqual('Updated')
  })

  it('updates the updatedAt timestamp', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Original')
    updateEntryTitle(db, newEntry.id, 'Updated')

    const updatedEntry = db.select().from(entries).where(eq(entries.id, newEntry.id)).get()
    expect(updatedEntry?.updatedAt).not.toBeNull()
  })
})

describe('toggleBookmark', () => {
  it('sets isBookmarked from false to true', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Original')
    toggleBookmark(db, newEntry.id)

    const updatedEntry = db.select().from(entries).where(eq(entries.id, newEntry.id)).get()
    expect(updatedEntry?.isBookmarked).toBe(true)
  })

  it('sets isBookmarked from true to false', () => {
    const newEntry = createEntry(db, '2026-05-02', 'Original')
    toggleBookmark(db, newEntry.id)
    toggleBookmark(db, newEntry.id)

    const updatedEntry = db.select().from(entries).where(eq(entries.id, newEntry.id)).get()
    expect(updatedEntry?.isBookmarked).toBe(false)
  })
})

describe('getAllBookmarkedEntries', () => {
  it('returns empty array when none are bookmarked', () => {
    createEntry(db, '2026-05-01', 'Entry 1')
    createEntry(db, '2026-05-02', 'Entry 2')
    createEntry(db, '2026-05-03', 'Entry 3')

    const allBookmarkedEntries = getAllBookmarkedEntries(db)
    expect(allBookmarkedEntries).toHaveLength(0)
  })

  it('returns only bookmarked entries', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    const entry3 = createEntry(db, '2026-05-03', 'Entry 3')
    toggleBookmark(db, entry1.id)
    toggleBookmark(db, entry2.id)
    toggleBookmark(db, entry3.id)
    toggleBookmark(db, entry3.id)

    const allBookmarkedEntries = getAllBookmarkedEntries(db)
    expect(allBookmarkedEntries.map((e) => e.id).sort()).toEqual([entry1.id, entry2.id])
  })

  it('orders bookmarked entries by date descending', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-03', 'Entry 2')
    const entry3 = createEntry(db, '2026-05-02', 'Entry 3')
    toggleBookmark(db, entry1.id)
    toggleBookmark(db, entry2.id)
    toggleBookmark(db, entry3.id)

    const allBookmarkedEntries = getAllBookmarkedEntries(db)
    expect(allBookmarkedEntries.map((e) => e.date)).toEqual([
      '2026-05-03',
      '2026-05-02',
      '2026-05-01'
    ])
  })
})
