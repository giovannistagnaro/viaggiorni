import { EntryWriting } from '@shared/types'
import { DrizzleDB } from '../database'
import { entryWritings } from '../schema'
import { eq, asc, sql } from 'drizzle-orm'

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
