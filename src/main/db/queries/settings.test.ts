import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
import {
  getSettings,
  updateTheme,
  updateStreakTolerance,
  updateOllamaModel,
  getEncryptionKey
} from './settings'
import { settings } from '../schemas/schema'
import type { DrizzleDB } from '../database'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getSettings', () => {
  it('returns the seeded settings row', () => {
    const row = getSettings(db)

    expect(row).toBeDefined()
    expect(row.theme).toBe('light')
    expect(row.streakTolerance).toBe(0)
  })

  it('throws when no settings row exists', () => {
    db.delete(settings).run()

    expect(() => getSettings(db)).toThrow(/Settings not found/i)
  })
})

describe('updateTheme', () => {
  it('updates the theme to the new value', () => {
    updateTheme(db, 'dark')

    expect(getSettings(db).theme).toBe('dark')
  })

  it('can switch back to light', () => {
    updateTheme(db, 'dark')
    updateTheme(db, 'light')

    expect(getSettings(db).theme).toBe('light')
  })
})

describe('updateStreakTolerance', () => {
  it('updates the streak tolerance to the new value', () => {
    updateStreakTolerance(db, 3)

    expect(getSettings(db).streakTolerance).toBe(3)
  })

  it('accepts 0', () => {
    updateStreakTolerance(db, 5)
    updateStreakTolerance(db, 0)

    expect(getSettings(db).streakTolerance).toBe(0)
  })
})

describe('updateOllamaModel', () => {
  it('sets the model to the given string', () => {
    updateOllamaModel(db, 'llama3:latest')

    expect(getSettings(db).ollamaModel).toBe('llama3:latest')
  })

  it('clears the model when given null', () => {
    updateOllamaModel(db, 'llama3:latest')
    updateOllamaModel(db, null)

    expect(getSettings(db).ollamaModel).toBeNull()
  })

  it('overwrites a previously set model', () => {
    updateOllamaModel(db, 'llama3:latest')
    updateOllamaModel(db, 'mistral:latest')

    expect(getSettings(db).ollamaModel).toBe('mistral:latest')
  })
})

describe('getEncryptionKey', () => {
  it('returns the existing key when one is present', () => {
    const first = getEncryptionKey(db)
    const second = getEncryptionKey(db)

    expect(second.equals(first)).toBe(true)
  })

  it('generates and persists a key on first call when none exists', () => {
    db.update(settings).set({ encryptionKey: null }).run()

    const generated = getEncryptionKey(db)

    expect(generated).toBeInstanceOf(Buffer)
    expect(generated.length).toBe(32)

    const persisted = db.select({ key: settings.encryptionKey }).from(settings).get()
    expect(persisted?.key?.equals(generated)).toBe(true)
  })

  it('throws when no settings row exists', () => {
    db.delete(settings).run()

    expect(() => getEncryptionKey(db)).toThrow(/Settings row missing/i)
  })
})
