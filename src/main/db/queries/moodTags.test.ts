import { DrizzleDB } from '../database'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
import { moodTags } from '../schema'
import { addMoodTagToEntry, createMoodTag, getAllMoodTags, getMoodTagsForEntry } from './moodTags'
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
    const fetchedMoodTags = getAllMoodTags(db)

    expect(fetchedMoodTags).toEqual([])
  })

  it('returns all existing mood tags', () => {
    const moodTags = getAllMoodTags(db)
    expect(moodTags.length).toEqual(DEFAULT_MOOD_TAGS.length)

    createMoodTag(db, 'Lazy')
    const updatedMoodTags = getAllMoodTags(db)
    expect(updatedMoodTags.length).toEqual(DEFAULT_MOOD_TAGS.length + 1)
  })
})

describe('getMoodTagsForEntry', () => {
  it('returns empty array when no entryId matches', () => {
    const moodTags = getMoodTagsForEntry(db, 999)

    expect(moodTags).toEqual([])
  })

  it('returns only mood tags for the specific entry', () => {
    createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createEntry(db, '2026-05-03', 'Entry 2')
    addMoodTagToEntry(db, entry2.id, 1)

    const moodTags = getMoodTagsForEntry(db, entry2.id)

    expect(moodTags.length).toEqual(1)
  })
})

describe('addMoodTagToEntry', () => {
  it('adds a mood tag with the correct id', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    addMoodTagToEntry(db, entry.id, 1)
    addMoodTagToEntry(db, entry.id, 2)
    addMoodTagToEntry(db, entry.id, 3)

    const moodTags = getMoodTagsForEntry(db, entry.id)

    expect(moodTags.length).toEqual(3)
  })
})
