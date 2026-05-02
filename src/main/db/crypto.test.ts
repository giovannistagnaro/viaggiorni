import { describe, it, expect } from 'vitest'
import { deriveKey, hashPassword, verifyPassword } from './crypto'

describe('deriveKey', () => {
  it('returns a hex string', () => {
    const password = 'test-password'
    const salt = Buffer.from('a'.repeat(64), 'hex')

    const result = deriveKey(password, salt)

    expect(result).toMatch(/^[0-9a-f]+$/)
  })
  it('returns the same output for the same inputs', () => {
    const password = 'test-password'
    const salt = Buffer.from('a'.repeat(64), 'hex')

    const result1 = deriveKey(password, salt)
    const result2 = deriveKey(password, salt)

    expect(result1).toBe(result2)
  })

  it('returns different output for a different password', () => {
    const password = 'test-password'
    const password2 = 'test-password-2'
    const salt = Buffer.from('a'.repeat(64), 'hex')

    const result1 = deriveKey(password, salt)
    const result2 = deriveKey(password2, salt)

    expect(result1).not.toBe(result2)
  })
  it('returns different output for a different salt', () => {
    const password = 'test-password'
    const salt = Buffer.from('a'.repeat(64), 'hex')
    const salt2 = Buffer.from('b'.repeat(64), 'hex')

    const result1 = deriveKey(password, salt)
    const result2 = deriveKey(password, salt2)

    expect(result1).not.toBe(result2)
  })
  it('returns a 64-character string (32 bytes as hex)', () => {
    const password = 'test-password'
    const salt = Buffer.from('a'.repeat(64), 'hex')

    const result = deriveKey(password, salt)

    expect(result).toHaveLength(64)
  })
})

describe('hashPassword', () => {
  it('returns an object with hash and salt', () => {
    const password = 'test-password'

    const result = hashPassword(password)

    expect(result.hash).toBeTypeOf('string')
    expect(result.salt).toBeTypeOf('string')
  })
  it('generates a different salt on each call', () => {
    const password = 'test-password'

    const result1 = hashPassword(password)
    const result2 = hashPassword(password)

    expect(result1.salt).not.toBe(result2.salt)
  })
  it('returns hash and salt of the correct length', () => {
    const result = hashPassword('test-password')

    expect(result.hash).toHaveLength(64)
    expect(result.salt).toHaveLength(64)
  })
})

describe('verifyPassword', () => {
  it('returns true for the correct password', () => {
    const password = 'test-password'
    const { hash, salt } = hashPassword(password)

    const result = verifyPassword(password, hash, salt)

    expect(result).toBe(true)
  })
  it('returns false for the wrong password', () => {
    const password = 'test-password'
    const password2 = 'test-password-2'
    const { hash, salt } = hashPassword(password)

    const result = verifyPassword(password2, hash, salt)

    expect(result).toBe(false)
  })
  it('is case-sensitive', () => {
    const password = 'test-password'
    const password2 = 'TEST-PASSWORD'
    const { hash, salt } = hashPassword(password)

    const result = verifyPassword(password2, hash, salt)

    expect(result).toBe(false)
  })
})
