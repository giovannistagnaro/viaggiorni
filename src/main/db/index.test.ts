import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./database', () => ({
  openDatabase: vi.fn(),
  closeDatabase: vi.fn()
}))
vi.mock('./seed', () => ({
  seedDatabase: vi.fn()
}))

import { openDatabase, closeDatabase } from './database'
import { seedDatabase } from './seed'
import { openDBWrapper, closeDBWrapper, getDB, isUnlocked } from './index'

describe('openDBWrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    closeDBWrapper()
  })

  it('opens the database and seeds it', () => {
    const fakeDb = { __sentinel: true } as never
    vi.mocked(openDatabase).mockReturnValue(fakeDb)

    openDBWrapper('pwd')

    expect(openDatabase).toHaveBeenCalledWith('pwd')
    expect(seedDatabase).toHaveBeenCalledWith(fakeDb)
  })

  it('returns early without re-opening if already open', () => {
    const fakeDb = { __sentinel: true } as never
    vi.mocked(openDatabase).mockReturnValue(fakeDb)

    openDBWrapper('pwd')
    openDBWrapper('pwd')

    expect(openDatabase).toHaveBeenCalledTimes(1)
    expect(seedDatabase).toHaveBeenCalledTimes(1)
  })

  it('closes the half-opened db and rethrows if seed fails', () => {
    const fakeDb = { __sentinel: true } as never
    const seedError = new Error('seed failed')
    vi.mocked(openDatabase).mockReturnValue(fakeDb)
    vi.mocked(seedDatabase).mockImplementation(() => {
      throw seedError
    })

    expect(() => openDBWrapper('pwd')).toThrow(seedError)
    expect(closeDatabase).toHaveBeenCalledWith(fakeDb)
    expect(isUnlocked()).toBe(false)
  })

  it('does not set state if openDatabase throws', () => {
    const openError = new Error('open failed')
    vi.mocked(openDatabase).mockImplementation(() => {
      throw openError
    })

    expect(() => openDBWrapper('pwd')).toThrow(openError)
    expect(seedDatabase).not.toHaveBeenCalled()
    expect(closeDatabase).not.toHaveBeenCalled()
    expect(isUnlocked()).toBe(false)
  })
})

describe('closeDBWrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    closeDBWrapper()
  })

  it('returns early if db is not open', () => {
    closeDBWrapper()

    expect(closeDatabase).not.toHaveBeenCalled()
  })

  it('calls closeDatabase and resets state', () => {
    const fakeDb = { __sentinel: true } as never
    vi.mocked(openDatabase).mockReturnValue(fakeDb)

    openDBWrapper('password')
    closeDBWrapper()

    expect(closeDatabase).toHaveBeenCalledWith(fakeDb)
    expect(isUnlocked()).toBe(false)
  })
})

describe('getDB', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    closeDBWrapper()
  })

  it('throws when db is locked', () => {
    expect(() => getDB()).toThrow('Cannot run queries on locked DB.')
  })

  it('returns the db instance when unlocked', () => {
    const fakeDb = { __sentinel: true } as never
    vi.mocked(openDatabase).mockReturnValue(fakeDb)

    openDBWrapper('pwd')

    expect(getDB()).toBe(fakeDb)
  })
})

describe('isUnlocked', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    closeDBWrapper()
  })

  it('returns false when db is not open', () => {
    expect(isUnlocked()).toBe(false)
  })

  it('returns true after openDBWrapper succeeds', () => {
    const fakeDb = { __sentinel: true } as never
    vi.mocked(openDatabase).mockReturnValue(fakeDb)

    openDBWrapper('pwd')

    expect(isUnlocked()).toBe(true)
  })
})
