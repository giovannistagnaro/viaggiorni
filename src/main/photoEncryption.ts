import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { readFile, writeFile } from 'fs/promises'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export async function encryptFile(srcPath: string, dstPath: string, key: Buffer): Promise<void> {
  const nonce = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH })
  const plaintext = await readFile(srcPath)
  const cipherText = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  await writeFile(dstPath, Buffer.concat([nonce, cipherText, tag]))
}

export async function decryptFile(encryptedPath: string, key: Buffer): Promise<Buffer> {
  const fileContents = await readFile(encryptedPath)
  const nonce = fileContents.subarray(0, IV_LENGTH)
  const tag = fileContents.subarray(fileContents.length - AUTH_TAG_LENGTH)
  const ciphertext = fileContents.subarray(IV_LENGTH, fileContents.length - AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(tag)

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  } catch (err) {
    throw new Error('Photo decryption failed (auth tag verification)', { cause: err })
  }
}
