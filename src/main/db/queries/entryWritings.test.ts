import { DrizzleDB } from '../database'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import {
  getUsedWritingPrompts,
  getWritingById,
  getWritingsForEntry,
  updateWritingContent,
  updateWritingPrompt
} from './entryWritings'
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

describe('updateWritingPrompt', () => {
  it('sets the prompt on the specified writing', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const promptWriting = getWritingsForEntry(db, entry.id).find(
      (w) => w.type === 'writing_prompt'
    )!

    updateWritingPrompt(db, promptWriting.id, 'A new prompt')

    expect(getWritingById(db, promptWriting.id)?.prompt).toBe('A new prompt')
  })

  it('does not modify the content field', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const promptWriting = getWritingsForEntry(db, entry.id).find(
      (w) => w.type === 'writing_prompt'
    )!
    updateWritingContent(db, promptWriting.id, 'user response')

    updateWritingPrompt(db, promptWriting.id, 'A new prompt')

    expect(getWritingById(db, promptWriting.id)?.content).toBe('user response')
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const promptWriting = getWritingsForEntry(db, entry.id).find(
      (w) => w.type === 'writing_prompt'
    )!

    updateWritingPrompt(db, promptWriting.id, 'A new prompt')

    expect(getWritingById(db, promptWriting.id)?.updatedAt).not.toBeNull()
  })
})

describe('getWritingById', () => {
  it('returns the writing with the matching id', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const target = getWritingsForEntry(db, entry.id)[0]

    expect(getWritingById(db, target.id)?.id).toBe(target.id)
  })

  it('returns null when no writing matches the id', () => {
    expect(getWritingById(db, 999)).toBeNull()
  })
})

describe('getUsedWritingPrompts', () => {
  it('returns an empty array when no writing prompts have been saved', () => {
    expect(getUsedWritingPrompts(db, '2026-05-01')).toEqual([])
  })

  it('excludes rows with a null prompt (entry created but prompt never set)', () => {
    createEntry(db, '2026-05-01', 'Entry 1')

    expect(getUsedWritingPrompts(db, '2026-05-01')).toEqual([])
  })

  it('returns prompts saved within the 90-day window before the given date', () => {
    const entry = createEntry(db, '2026-04-01', 'Entry 1')
    const promptWriting = getWritingsForEntry(db, entry.id).find(
      (w) => w.type === 'writing_prompt'
    )!
    updateWritingPrompt(db, promptWriting.id, 'In-window prompt')

    expect(getUsedWritingPrompts(db, '2026-05-01')).toContain('In-window prompt')
  })

  it('excludes prompts on entries older than 90 days', () => {
    const old = createEntry(db, '2026-01-30', 'Old')
    const promptWriting = getWritingsForEntry(db, old.id).find(
      (w) => w.type === 'writing_prompt'
    )!
    updateWritingPrompt(db, promptWriting.id, 'Old prompt')

    expect(getUsedWritingPrompts(db, '2026-05-01')).toEqual([])
  })

  it('includes a prompt on an entry exactly 90 days before the given date', () => {
    const boundary = createEntry(db, '2026-01-31', 'Boundary')
    const promptWriting = getWritingsForEntry(db, boundary.id).find(
      (w) => w.type === 'writing_prompt'
    )!
    updateWritingPrompt(db, promptWriting.id, 'Boundary prompt')

    expect(getUsedWritingPrompts(db, '2026-05-01')).toContain('Boundary prompt')
  })

  it('returns multiple prompts when multiple in-window entries have prompts', () => {
    const e1 = createEntry(db, '2026-04-01', 'A')
    const e2 = createEntry(db, '2026-04-15', 'B')
    const p1 = getWritingsForEntry(db, e1.id).find((w) => w.type === 'writing_prompt')!
    const p2 = getWritingsForEntry(db, e2.id).find((w) => w.type === 'writing_prompt')!
    updateWritingPrompt(db, p1.id, 'First')
    updateWritingPrompt(db, p2.id, 'Second')

    const result = getUsedWritingPrompts(db, '2026-05-01')
    expect(result).toContain('First')
    expect(result).toContain('Second')
  })
})
