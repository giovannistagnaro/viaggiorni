import { pbkdf2Sync, randomBytes } from 'crypto'
import { SALT_BYTES } from './dbConstants'
const HASH_ITERATIONS = 220_000 // recommended by OWASP (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
const KEY_LENGTH = 32

export function deriveKey(password: string, salt: Buffer): string {
  const key = pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, 'sha512')
  return key.toString('hex')
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const saltBuffer = randomBytes(SALT_BYTES)
  const hash = deriveKey(password, saltBuffer)
  const salt = saltBuffer.toString('hex')

  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidateHash = deriveKey(password, Buffer.from(salt, 'hex'))
  return candidateHash === hash
}
