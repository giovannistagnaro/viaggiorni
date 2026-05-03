import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'
import { seedDatabase } from '../seed'
import type { DrizzleDB } from '../database'

export function createTestDb(): DrizzleDB {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite)
  migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') })
  seedDatabase(db)
  return db
}

export function closeTestDb(db: DrizzleDB): void {
  db.$client.close()
}
