import { EntryWriting, WritingType } from '@shared/types'
import { DrizzleDB } from '../database'
import { entries, entryWritings } from '../schemas/schema'
import { eq, asc, sql, gte, and, gt, lt, lte, max } from 'drizzle-orm'
import { addDays } from '../../../shared/helpers'

export function getWritingsForEntry(db: DrizzleDB, entryId: number): EntryWriting[] {
  return db
    .select()
    .from(entryWritings)
    .where(eq(entryWritings.entryId, entryId))
    .orderBy(asc(entryWritings.position))
    .all()
}

export function addEntryWriting(
  db: DrizzleDB,
  entryId: number,
  type: WritingType,
  label: string | null
): EntryWriting {
  return db.transaction((tx) => {
    const exists = tx.select({ id: entries.id }).from(entries).where(eq(entries.id, entryId)).get()
    if (!exists) throw new Error('Entry not found')

    const maxRow = tx
      .select({ max: sql<number>`COALESCE(MAX(${entryWritings.position}), -1)` })
      .from(entryWritings)
      .where(eq(entryWritings.entryId, entryId))
      .get()

    const position = (maxRow?.max ?? -1) + 1

    return tx
      .insert(entryWritings)
      .values({ entryId, type, label, position, isVisible: true })
      .returning()
      .get()
  })
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

export function setEntryWritingVisibility(
  db: DrizzleDB,
  writingId: number,
  isVisible: boolean
): void {
  const result = db
    .update(entryWritings)
    .set({ isVisible, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(entryWritings.id, writingId))
    .run()

  if (result.changes === 0) throw new Error('Entry writing not found')
}

export function changeEntryWritingPosition(
  db: DrizzleDB,
  writingId: number,
  newPosition: number
): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: entryWritings.position, entryId: entryWritings.entryId })
      .from(entryWritings)
      .where(eq(entryWritings.id, writingId))
      .get()

    if (!row) throw new Error('Entry writing not found')

    const maxRow = tx
      .select({ maxPosition: max(entryWritings.position) })
      .from(entryWritings)
      .where(eq(entryWritings.entryId, row.entryId))
      .get()

    const maxPosition = maxRow?.maxPosition ?? 1
    newPosition = Math.max(0, Math.min(newPosition, maxPosition))

    const oldPosition = row.position

    if (newPosition > oldPosition) {
      tx.update(entryWritings)
        .set({ position: sql`${entryWritings.position} - 1` })
        .where(
          and(
            eq(entryWritings.entryId, row.entryId),
            gt(entryWritings.position, oldPosition),
            lte(entryWritings.position, newPosition)
          )
        )
        .run()
    } else if (newPosition < oldPosition) {
      tx.update(entryWritings)
        .set({ position: sql`${entryWritings.position} + 1` })
        .where(
          and(
            eq(entryWritings.entryId, row.entryId),
            lt(entryWritings.position, oldPosition),
            gte(entryWritings.position, newPosition)
          )
        )
        .run()
    } else {
      return
    }

    tx.update(entryWritings)
      .set({ position: newPosition, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(entryWritings.id, writingId))
      .run()
  })
}
