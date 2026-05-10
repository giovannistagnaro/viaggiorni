import { DrizzleDB } from '../database'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import {
  changeEntryWritingPosition,
  getUsedWritingPrompts,
  getWritingById,
  getWritingsForEntry,
  setEntryWritingVisibility,
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

describe('setEntryWritingVisibility', () => {
  it('sets isVisible to false', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writing = getWritingsForEntry(db, entry.id)[0]

    setEntryWritingVisibility(db, writing.id, false)

    expect(getWritingById(db, writing.id)?.isVisible).toBe(false)
  })

  it('sets isVisible back to true', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writing = getWritingsForEntry(db, entry.id)[0]
    setEntryWritingVisibility(db, writing.id, false)

    setEntryWritingVisibility(db, writing.id, true)

    expect(getWritingById(db, writing.id)?.isVisible).toBe(true)
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writing = getWritingsForEntry(db, entry.id)[0]

    setEntryWritingVisibility(db, writing.id, false)

    expect(getWritingById(db, writing.id)?.updatedAt).not.toBeNull()
  })

  it('throws when the writing does not exist', () => {
    expect(() => setEntryWritingVisibility(db, 999, false)).toThrow(/Entry writing not found/i)
  })
})

describe('changeEntryWritingPosition', () => {
  it('moves a writing to a higher position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)
    const target = writings[0]

    changeEntryWritingPosition(db, target.id, writings.length - 1)

    const after = getWritingsForEntry(db, entry.id)
    expect(after.find((w) => w.id === target.id)?.position).toBe(writings.length - 1)
  })

  it('moves a writing to a lower position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)
    const target = writings[writings.length - 1]

    changeEntryWritingPosition(db, target.id, 0)

    const after = getWritingsForEntry(db, entry.id)
    expect(after.find((w) => w.id === target.id)?.position).toBe(0)
  })

  it('does nothing when newPosition equals the current position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)
    const before = writings.map((w) => ({ id: w.id, position: w.position }))

    changeEntryWritingPosition(db, writings[0].id, writings[0].position)

    const after = getWritingsForEntry(db, entry.id).map((w) => ({ id: w.id, position: w.position }))
    expect(after).toEqual(before)
  })

  it('clamps newPosition higher than max to the end', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)

    changeEntryWritingPosition(db, writings[0].id, 999)

    const after = getWritingsForEntry(db, entry.id)
    expect(after.find((w) => w.id === writings[0].id)?.position).toBe(writings.length - 1)
  })

  it('clamps negative newPosition to the start', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)
    const target = writings[writings.length - 1]

    changeEntryWritingPosition(db, target.id, -5)

    const after = getWritingsForEntry(db, entry.id)
    expect(after.find((w) => w.id === target.id)?.position).toBe(0)
  })

  it('preserves contiguous positions across the entry after a move', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)

    changeEntryWritingPosition(db, writings[0].id, writings.length - 1)

    const after = getWritingsForEntry(db, entry.id)
    const positions = after.map((w) => w.position).sort((a, b) => a - b)
    expect(positions).toEqual(Array.from({ length: writings.length }, (_, i) => i))
  })

  it('updates the updatedAt timestamp on the moved writing', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const writings = getWritingsForEntry(db, entry.id)

    changeEntryWritingPosition(db, writings[0].id, writings.length - 1)

    expect(getWritingById(db, writings[0].id)?.updatedAt).not.toBeNull()
  })

  it('throws when the writing does not exist', () => {
    expect(() => changeEntryWritingPosition(db, 999, 0)).toThrow(/Entry writing not found/i)
  })

  it('does not affect writings in other entries', () => {
    const e1 = createEntry(db, '2026-05-01', 'Entry 1')
    const e2 = createEntry(db, '2026-05-02', 'Entry 2')
    const e2Before = getWritingsForEntry(db, e2.id).map((w) => ({
      id: w.id,
      position: w.position
    }))

    const e1Writing = getWritingsForEntry(db, e1.id)[0]
    changeEntryWritingPosition(db, e1Writing.id, 999)

    const e2After = getWritingsForEntry(db, e2.id).map((w) => ({
      id: w.id,
      position: w.position
    }))
    expect(e2After).toEqual(e2Before)
  })
})
