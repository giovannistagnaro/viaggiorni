import { EntryWriting } from '@shared/types'
import { DrizzleDB } from '../database'
import { entries, entryWritings } from '../schemas/schema'
import { eq, asc, sql, gte, and } from 'drizzle-orm'
import { addDays } from './helpers'

export function getWritingsForEntry(db: DrizzleDB, entryId: number): EntryWriting[] {
  return db
    .select()
    .from(entryWritings)
    .where(eq(entryWritings.entryId, entryId))
    .orderBy(asc(entryWritings.position))
    .all()
}

export function updateWritingContent(db: DrizzleDB, writingId: number, content: string): void {
  db.update(entryWritings)
    .set({ content, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(entryWritings.id, writingId))
    .run()
}

export function updateWritingPrompt(db: DrizzleDB, writingId: number, prompt: string): void {
  db.update(entryWritings)
    .set({ prompt, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(entryWritings.id, writingId))
    .run()
}

export function getUsedWritingPrompts(db: DrizzleDB, date: string): string[] {
  const ninetyDaysAgo = addDays(date, -90)

  const rows = db
    .select({ prompt: entryWritings.prompt })
    .from(entryWritings)
    .innerJoin(entries, eq(entryWritings.entryId, entries.id))
    .where(and(eq(entryWritings.type, 'writing_prompt'), gte(entries.date, ninetyDaysAgo)))
    .all()

  return rows.flatMap((r) => (r.prompt ? [r.prompt] : []))
}

export function getWritingById(db: DrizzleDB, writingId: number): EntryWriting | null {
  return db.select().from(entryWritings).where(eq(entryWritings.id, writingId)).get() ?? null
}
