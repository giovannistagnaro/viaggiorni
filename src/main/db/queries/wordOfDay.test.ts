import { DrizzleDB } from '../database'
import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
import { getWordForDate, getUsedWords, saveWord } from './wordOfDay'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getWordForDate', () => {
  it('returns null when no word has been saved for that date', () => {
    const word = getWordForDate(db, '2026-05-04')

    expect(word).toBeNull()
  })

  it('returns the saved word entry for the matching date', () => {
    saveWord(db, '2026-05-04', 'word', 'definition', 'example', 'local')

    const word = getWordForDate(db, '2026-05-04')

    expect(word).not.toBeNull()
    expect(word?.word).toEqual('word')
    expect(word?.definition).toEqual('definition')
    expect(word?.example).toEqual('example')
    expect(word?.source).toEqual('local')
  })

  it('returns null when a word exists only for a different date', () => {
    saveWord(db, '2026-05-04', 'word', 'definition', 'example', 'local')

    const word = getWordForDate(db, '2026-05-05')

    expect(word).toBeNull()
  })
})

describe('saveWord', () => {
  it('persists each field exactly as passed', () => {
    saveWord(
      db,
      '2026-05-04',
      'ephemeral',
      'Lasting a very short time.',
      'A fleeting smile.',
      'ollama'
    )

    const word = getWordForDate(db, '2026-05-04')

    expect(word?.entryDate).toEqual('2026-05-04')
    expect(word?.word).toEqual('ephemeral')
    expect(word?.definition).toEqual('Lasting a very short time.')
    expect(word?.example).toEqual('A fleeting smile.')
  })

  it('records source="ollama" correctly', () => {
    saveWord(db, '2026-05-04', 'word', 'definition', 'example', 'ollama')

    const word = getWordForDate(db, '2026-05-04')

    expect(word?.source).toEqual('ollama')
  })

  it('records source="local" correctly', () => {
    saveWord(db, '2026-05-04', 'word', 'definition', 'example', 'local')

    const word = getWordForDate(db, '2026-05-04')

    expect(word?.source).toEqual('local')
  })
})

describe('getUsedWords', () => {
  it('returns an empty array when no words have been saved', () => {
    const used = getUsedWords(db, '2026-05-01')

    expect(used).toEqual([])
  })

  it('returns word strings rather than full row objects', () => {
    saveWord(db, '2026-05-01', 'serendipity', 'definition', 'example', 'local')

    const used = getUsedWords(db, '2026-05-01')

    expect(used).toEqual(['serendipity'])
  })

  it('returns words saved within the 90-day window before the given date', () => {
    saveWord(db, '2026-04-30', 'one', 'definition', 'example', 'local')
    saveWord(db, '2026-04-01', 'thirty', 'definition', 'example', 'local')
    saveWord(db, '2026-02-01', 'eightynine', 'definition', 'example', 'local')

    const used = getUsedWords(db, '2026-05-01')

    expect(used.length).toEqual(3)
    expect(used).toContain('one')
    expect(used).toContain('thirty')
    expect(used).toContain('eightynine')
  })

  it('excludes words saved more than 90 days before the given date', () => {
    saveWord(db, '2026-01-30', 'outOfWindow', 'definition', 'example', 'local')
    saveWord(db, '2026-04-01', 'inWindow', 'definition', 'example', 'local')

    const used = getUsedWords(db, '2026-05-01')

    expect(used).toEqual(['inWindow'])
  })

  it('includes a word saved exactly 90 days before the given date (inclusive boundary)', () => {
    saveWord(db, '2026-01-31', 'boundary', 'definition', 'example', 'local')

    const used = getUsedWords(db, '2026-05-01')

    expect(used).toEqual(['boundary'])
  })

  it('includes a word saved on the reference date itself', () => {
    saveWord(db, '2026-05-01', 'today', 'definition', 'example', 'local')

    const used = getUsedWords(db, '2026-05-01')

    expect(used).toEqual(['today'])
  })
})
