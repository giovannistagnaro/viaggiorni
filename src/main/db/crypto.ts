import { pbkdf2Sync, randomBytes } from 'crypto'
import { SALT_BYTES } from './dbConstants'
const HASH_ITERATIONS = 220_000 // recommended by OWASP (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
const KEY_LENGTH = 32
const ENCRYPTION_ALGORITHM = 'sha512'
const STRING_FORMAT = 'hex'

export function deriveKey(password: string, salt: Buffer): string {
  const key = pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, ENCRYPTION_ALGORITHM)
  return key.toString(STRING_FORMAT)
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const saltBuffer = randomBytes(SALT_BYTES)
  const hash = deriveKey(password, saltBuffer)
  const salt = saltBuffer.toString(STRING_FORMAT)

  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidateHash = deriveKey(password, Buffer.from(salt, STRING_FORMAT))
  return candidateHash === hash
}
