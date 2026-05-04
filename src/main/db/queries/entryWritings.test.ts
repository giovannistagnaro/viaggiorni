import { DrizzleDB } from '../database'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { getWritingsForEntry, updateWritingContent } from './entryWritings'
import { createEntry } from './entries'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getWritingsForEntry', () => {
  it('returns empty array when no entryId matches', () => {
    const matchingWritings = getWritingsForEntry(db, 999)

    expect(matchingWritings).toEqual([])
  })

  it('returns only writings for the specific entry', () => {
    createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createEntry(db, '2026-05-03', 'Entry 2')

    const matchingWritings = getWritingsForEntry(db, entry2.id)

    expect(matchingWritings.length).toBeGreaterThan(0)
    expect(matchingWritings.every((writing) => writing.entryId === entry2.id)).toBe(true)
  })

  it('orders writings by position ascending', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const matchingWritings = getWritingsForEntry(db, entry.id)

    expect(matchingWritings.length).toBeGreaterThan(0)
    expect(matchingWritings.map((writing) => writing.position)).toEqual(
      matchingWritings.map((writing) => writing.position).sort((a, b) => a - b)
    )
  })
})

describe('updateWritingContent', () => {
  it('updates the content of an existing writing', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)
    const writingId = writings[0].id

    const updatedContent = 'Updated content'
    updateWritingContent(db, writingId, updatedContent)

    const updatedWriting = getWritingsForEntry(db, entry.id).find(
      (writing) => writing.id === writingId
    )
    expect(updatedWriting?.content).toEqual(updatedContent)
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)
    const writingId = writings[0].id

    updateWritingContent(db, writingId, 'Updated content')

    const updatedWriting = getWritingsForEntry(db, entry.id).find(
      (writing) => writing.id === writingId
    )
    expect(updatedWriting?.updatedAt).not.toBeNull()
  })
})
