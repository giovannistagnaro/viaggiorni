import Database from 'better-sqlite3-multiple-ciphers'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { join } from 'path'
import { deriveKey } from './crypto'
import log from 'electron-log'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { randomBytes } from 'crypto'
import { SALT_BYTES } from './dbConstants'

export type DrizzleDB = ReturnType<typeof drizzle>

export function openDatabase(password: string): DrizzleDB {
  const databasePath = join(app.getPath('userData'), 'viaggiorni.db')
  const saltPath = join(app.getPath('userData'), 'salt.bin')
  const migrationsFolder = app.isPackaged
    ? join(process.resourcesPath, 'drizzle')
    : join(app.getAppPath(), 'drizzle')

  let salt: Buffer
  if (!existsSync(saltPath)) {
    salt = randomBytes(SALT_BYTES)
    writeFileSync(saltPath, salt)
    log.info('Salt path created')
  } else {
    salt = readFileSync(saltPath)
  }

  try {
    const db = new Database(databasePath)
    db.pragma('journal_mode = WAL') // good for performance (https://www.npmjs.com/package/better-sqlite3-multiple-ciphers)
    db.pragma(`key="x'${deriveKey(password, salt)}'"`)
    const drizzleDB: DrizzleDB = drizzle(db)
    migrate(drizzleDB, { migrationsFolder })
    log.info('DB opened')
    return drizzleDB
  } catch (err) {
    log.error('Could not open DB: ', err)
    throw err
  }
}

export function closeDatabase(db: Database.Database): void {
  db.close()
  log.info('DB Closed')
}
