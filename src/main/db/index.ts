import { existsSync, mkdirSync } from 'fs'
import { closeDatabase, DrizzleDB, openDatabase } from './database'
import { seedDatabase } from './seed'
import log from 'electron-log'
import { PHOTOS_DIR_NAME, SALT_FILE_NAME } from './dbConstants'
import { join } from 'path'
import { app } from 'electron'

let db: DrizzleDB | null = null

export function openDBWrapper(password: string): void {
  if (db !== null) return

  // hold db instance locally until seed succeeds to
  // prevent half-initialized DB exposure
  const opened = openDatabase(password)
  try {
    seedDatabase(opened)
    // Ensure the photos directory exists. Fresh installs don't get this
    // created automatically, so photo uploads fail until something else
    // (like a backup import) creates it.
    mkdirSync(join(app.getPath('userData'), PHOTOS_DIR_NAME), { recursive: true })
    db = opened
  } catch (err) {
    closeDatabase(opened)
    throw err
  }
}

export function closeDBWrapper(): void {
  if (db === null) return
  closeDatabase(db)
  db = null
}

export function getDB(): DrizzleDB {
  if (db === null) {
    log.warn('Attempted query on locked DB.')
    throw new Error('Cannot run queries on locked DB.')
  }
  return db
}

export function isUnlocked(): boolean {
  return db !== null
}

export function isFirstLaunch(): boolean {
  return !existsSync(join(app.getPath('userData'), SALT_FILE_NAME))
}
