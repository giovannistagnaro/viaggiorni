import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'fs'
import { rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { encryptFile, decryptFile } from './photoEncryption'

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'photo-encryption-test-'))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe('encryptFile + decryptFile', () => {
  it('round-trips: encrypted file decrypts back to the original bytes', async () => {
    const key = randomBytes(32)
    const original = Buffer.from('hello world test data')
    const srcPath = join(tempDir, 'src')
    const encPath = join(tempDir, 'src.enc')
    writeFileSync(srcPath, original)

    await encryptFile(srcPath, encPath, key)
    const decrypted = await decryptFile(encPath, key)

    expect(decrypted.equals(original)).toBe(true)
  })

  it('round-trips binary content (simulated image bytes)', async () => {
    const key = randomBytes(32)
    const original = randomBytes(1024)
    const srcPath = join(tempDir, 'image.bin')
    const encPath = join(tempDir, 'image.enc')
    writeFileSync(srcPath, original)

    await encryptFile(srcPath, encPath, key)
    const decrypted = await decryptFile(encPath, key)

    expect(decrypted.equals(original)).toBe(true)
  })

  it('round-trips an empty file', async () => {
    const key = randomBytes(32)
    const original = Buffer.alloc(0)
    const srcPath = join(tempDir, 'empty')
    const encPath = join(tempDir, 'empty.enc')
    writeFileSync(srcPath, original)

    await encryptFile(srcPath, encPath, key)
    const decrypted = await decryptFile(encPath, key)

    expect(decrypted.equals(original)).toBe(true)
  })

  it('produces different ciphertext on repeated encryption of identical plaintext', async () => {
    // confirms the IV is randomized per call
    const key = randomBytes(32)
    const plaintext = Buffer.from('same input every time')
    const srcPath = join(tempDir, 'src')
    const enc1Path = join(tempDir, 'enc1')
    const enc2Path = join(tempDir, 'enc2')
    writeFileSync(srcPath, plaintext)

    await encryptFile(srcPath, enc1Path, key)
    await encryptFile(srcPath, enc2Path, key)

    const enc1 = readFileSync(enc1Path)
    const enc2 = readFileSync(enc2Path)
    expect(enc1.equals(enc2)).toBe(false)
  })

  it('throws when decrypting with the wrong key', async () => {
    const correctKey = randomBytes(32)
    const wrongKey = randomBytes(32)
    const srcPath = join(tempDir, 'src')
    const encPath = join(tempDir, 'src.enc')
    writeFileSync(srcPath, Buffer.from('secret data'))

    await encryptFile(srcPath, encPath, correctKey)

    await expect(decryptFile(encPath, wrongKey)).rejects.toThrow()
  })

  it('throws when ciphertext has been tampered with', async () => {
    const key = randomBytes(32)
    const srcPath = join(tempDir, 'src')
    const encPath = join(tempDir, 'src.enc')
    writeFileSync(srcPath, Buffer.from('important data here'))

    await encryptFile(srcPath, encPath, key)

    // flip a byte in the ciphertext region (between IV at 0..12 and tag at end-16..end)
    const encrypted = readFileSync(encPath)
    encrypted[20] ^= 0xff
    writeFileSync(encPath, encrypted)

    await expect(decryptFile(encPath, key)).rejects.toThrow()
  })

  it('throws when the auth tag has been tampered with', async () => {
    const key = randomBytes(32)
    const srcPath = join(tempDir, 'src')
    const encPath = join(tempDir, 'src.enc')
    writeFileSync(srcPath, Buffer.from('data'))

    await encryptFile(srcPath, encPath, key)

    // flip the last byte (auth tag is the trailing 16 bytes)
    const encrypted = readFileSync(encPath)
    encrypted[encrypted.length - 1] ^= 0xff
    writeFileSync(encPath, encrypted)

    await expect(decryptFile(encPath, key)).rejects.toThrow()
  })

  it('throws when the IV has been tampered with', async () => {
    const key = randomBytes(32)
    const srcPath = join(tempDir, 'src')
    const encPath = join(tempDir, 'src.enc')
    writeFileSync(srcPath, Buffer.from('data'))

    await encryptFile(srcPath, encPath, key)

    // flip a byte in the IV region (first 12 bytes)
    const encrypted = readFileSync(encPath)
    encrypted[0] ^= 0xff
    writeFileSync(encPath, encrypted)

    await expect(decryptFile(encPath, key)).rejects.toThrow()
  })

  it('throws a meaningful error message on auth tag verification failure', async () => {
    const correctKey = randomBytes(32)
    const wrongKey = randomBytes(32)
    const srcPath = join(tempDir, 'src')
    const encPath = join(tempDir, 'src.enc')
    writeFileSync(srcPath, Buffer.from('data'))

    await encryptFile(srcPath, encPath, correctKey)

    await expect(decryptFile(encPath, wrongKey)).rejects.toThrow(/decryption failed/i)
  })
})
