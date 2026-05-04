import { DrizzleDB } from '../database'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
import { moodTags } from '../schema'
import {
  addMoodTagToEntry,
  createMoodTag,
  getAllMoodTags,
  getMoodTagsForEntry,
  removeMoodTag,
  removeMoodTagFromEntry
} from './moodTags'
import { DEFAULT_MOOD_TAGS } from '../dbConstants'
import { createEntry } from './entries'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getAllMoodTags', () => {
  it('returns empty array when no tags found', () => {
    db.delete(moodTags).run()
    const result = getAllMoodTags(db)

    expect(result).toEqual([])
  })

  it('returns all existing mood tags', () => {
    const result = getAllMoodTags(db)
    expect(result.length).toEqual(DEFAULT_MOOD_TAGS.length)
  })

  it('returns user-added tags alongside defaults', () => {
    createMoodTag(db, 'Lazy')

    const result = getAllMoodTags(db)
    expect(result.length).toEqual(DEFAULT_MOOD_TAGS.length + 1)
    expect(result.some((tag) => tag.label === 'Lazy')).toBe(true)
  })
})

describe('getMoodTagsForEntry', () => {
  it('returns empty array when no entryId matches', () => {
    const result = getMoodTagsForEntry(db, 999)

    expect(result).toEqual([])
  })

  it('returns empty array when entry has no mood tags', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const result = getMoodTagsForEntry(db, entry.id)
    expect(result).toEqual([])
  })

  it('returns only mood tags for the specific entry', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    const tag = getAllMoodTags(db)[0]
    addMoodTagToEntry(db, entry1.id, tag.id)

    const result = getMoodTagsForEntry(db, entry2.id)
    expect(result).toEqual([])
  })

  it('returns the actual tag rows linked to the entry', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const allTags = getAllMoodTags(db)
    addMoodTagToEntry(db, entry.id, allTags[0].id)
    addMoodTagToEntry(db, entry.id, allTags[1].id)

    const result = getMoodTagsForEntry(db, entry.id)
    expect(result.length).toBe(2)
    expect(result.map((t) => t.id).sort()).toEqual([allTags[0].id, allTags[1].id].sort())
  })
})

describe('addMoodTagToEntry', () => {
  it('adds a mood tag to the specified entry', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const tag = getAllMoodTags(db)[0]

    addMoodTagToEntry(db, entry.id, tag.id)

    const result = getMoodTagsForEntry(db, entry.id)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(tag.id)
  })

  it('adds multiple distinct tags to the same entry', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const allTags = getAllMoodTags(db)

    addMoodTagToEntry(db, entry.id, allTags[0].id)
    addMoodTagToEntry(db, entry.id, allTags[1].id)
    addMoodTagToEntry(db, entry.id, allTags[2].id)

    const result = getMoodTagsForEntry(db, entry.id)
    expect(result.length).toBe(3)
  })
})

describe('removeMoodTagFromEntry', () => {
  it('removes only the specified tag from the entry', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const allTags = getAllMoodTags(db)
    addMoodTagToEntry(db, entry.id, allTags[0].id)
    addMoodTagToEntry(db, entry.id, allTags[1].id)
    addMoodTagToEntry(db, entry.id, allTags[2].id)

    removeMoodTagFromEntry(db, entry.id, allTags[1].id)

    const remaining = getMoodTagsForEntry(db, entry.id)
    expect(remaining.length).toBe(2)
    expect(remaining.map((t) => t.id).sort()).toEqual(
      [allTags[0].id, allTags[2].id].sort()
    )
  })

  it('does not affect the same tag selected on a different entry', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    const tag = getAllMoodTags(db)[0]
    addMoodTagToEntry(db, entry1.id, tag.id)
    addMoodTagToEntry(db, entry2.id, tag.id)

    removeMoodTagFromEntry(db, entry1.id, tag.id)

    expect(getMoodTagsForEntry(db, entry1.id).length).toBe(0)
    expect(getMoodTagsForEntry(db, entry2.id).length).toBe(1)
  })
})

describe('createMoodTag', () => {
  it('creates a new tag with the given label', () => {
    createMoodTag(db, 'NewMood')

    const result = getAllMoodTags(db)
    expect(result.some((t) => t.label === 'NewMood')).toBe(true)
  })

  it('does not create a duplicate when label already exists', () => {
    const beforeCount = getAllMoodTags(db).length

    createMoodTag(db, 'Unique')
    createMoodTag(db, 'Unique')

    expect(getAllMoodTags(db).length).toBe(beforeCount + 1)
  })

  it('does not create a duplicate of a default tag', () => {
    const beforeCount = getAllMoodTags(db).length
    const existingLabel = DEFAULT_MOOD_TAGS[0]

    createMoodTag(db, existingLabel)

    expect(getAllMoodTags(db).length).toBe(beforeCount)
  })

  it('does not create a duplicate when label exists with different casing', () => {
    createMoodTag(db, 'Excited')
    const afterFirst = getAllMoodTags(db).length

    createMoodTag(db, 'EXCITED')
    createMoodTag(db, 'excited')
    createMoodTag(db, 'eXcItEd')

    expect(getAllMoodTags(db).length).toBe(afterFirst)
  })
})

describe('removeMoodTag', () => {
  it('removes the tag from the database', () => {
    createMoodTag(db, 'ToRemove')
    const tag = getAllMoodTags(db).find((t) => t.label === 'ToRemove')
    expect(tag).toBeDefined()

    removeMoodTag(db, tag!.id)

    const result = getAllMoodTags(db)
    expect(result.find((t) => t.id === tag!.id)).toBeUndefined()
  })
})
