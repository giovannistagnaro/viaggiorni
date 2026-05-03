import { DrizzleDB } from '../database'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { getSectionsForEntry, updateSectionContent } from './entrySections'
import { createEntry } from './entries'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getSectionsForEntry', () => {
  it('returns empty array when no entryId matches', () => {
    const matchingSections = getSectionsForEntry(db, 999)

    expect(matchingSections).toEqual([])
  })

  it('returns only sections for the specific entry', () => {
    createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createEntry(db, '2026-05-03', 'Entry 2')

    const matchingSections = getSectionsForEntry(db, entry2.id)

    expect(matchingSections.length).toBeGreaterThan(0)
    expect(matchingSections.every((section) => section.entryId === entry2.id)).toBe(true)
  })

  it('orders sections by position ascending', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const matchingSections = getSectionsForEntry(db, entry.id)

    expect(matchingSections.length).toBeGreaterThan(0)
    expect(matchingSections.map((section) => section.position)).toEqual(
      matchingSections.map((section) => section.position).sort((a, b) => a - b)
    )
  })
})

describe('updateSectionContent', () => {
  it('updates the content of an existing section', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const sections = getSectionsForEntry(db, entry.id)
    const sectionId = sections[0].id

    const updatedContent = 'Updated content'
    updateSectionContent(db, sectionId, updatedContent)

    const updatedSection = getSectionsForEntry(db, entry.id).find(
      (section) => section.id === sectionId
    )
    expect(updatedSection?.content).toEqual(updatedContent)
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const sections = getSectionsForEntry(db, entry.id)
    const sectionId = sections[0].id

    updateSectionContent(db, sectionId, 'Updated content')

    const updatedSection = getSectionsForEntry(db, entry.id).find(
      (section) => section.id === sectionId
    )
    expect(updatedSection?.updatedAt).not.toBeNull()
  })
})
