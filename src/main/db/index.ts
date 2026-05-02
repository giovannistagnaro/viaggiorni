import { closeDatabase, DrizzleDB, openDatabase } from './database'
import { seedDatabase } from './seed'
import log from 'electron-log'

let db: DrizzleDB | null = null

export function openDBWrapper(password: string): void {
  if (db !== null) return

  // hold db instance locally until seed succeeds to
  // prevent half-initialized DB exposure
  const opened = openDatabase(password)
  try {
    seedDatabase(opened)
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
