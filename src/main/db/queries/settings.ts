import { SafeReturnSettings, Theme } from '@shared/types'
import { settings } from '../schemas/schema'
import { randomBytes } from 'crypto'
import { DrizzleDB } from '../database'
import { eq } from 'drizzle-orm'

export function getSettings(db: DrizzleDB): SafeReturnSettings {
  const settingsRow = db
    .select({
      id: settings.id,
      theme: settings.theme,
      streakTolerance: settings.streakTolerance,
      ollamaModel: settings.ollamaModel,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    })
    .from(settings)
    .get()

  if (!settingsRow) throw new Error('Settings not found')
  return settingsRow
}

export function updateTheme(db: DrizzleDB, theme: Theme): void {
  db.update(settings).set({ theme }).where(eq(settings.id, 1)).run()
}

export function updateStreakTolerance(db: DrizzleDB, tolerance: number): void {
  db.update(settings).set({ streakTolerance: tolerance }).where(eq(settings.id, 1)).run()
}

export function updateOllamaModel(db: DrizzleDB, model: string | null): void {
  db.update(settings).set({ ollamaModel: model }).where(eq(settings.id, 1)).run()
}

export function getEncryptionKey(db: DrizzleDB): Buffer {
  const row = db.select().from(settings).get()

  if (!row) {
    throw new Error('Settings row missing — DB not properly seeded')
  }

  if (row.encryptionKey) return row.encryptionKey

  const generatedKey = randomBytes(32)
  db.update(settings).set({ encryptionKey: generatedKey }).where(eq(settings.id, row.id)).run()
  return generatedKey
}
