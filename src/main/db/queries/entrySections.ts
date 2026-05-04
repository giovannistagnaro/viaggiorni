import { EntrySection } from '@shared/types'
import { DrizzleDB } from '../database'
import { entrySections } from '../schema'
import { eq, asc, sql } from 'drizzle-orm'

export function getSectionsForEntry(db: DrizzleDB, entryId: number): EntrySection[] {
  return db
    .select()
    .from(entrySections)
    .where(eq(entrySections.entryId, entryId))
    .orderBy(asc(entrySections.position))
    .all()
}

export function updateSectionContent(db: DrizzleDB, sectionId: number, content: string): void {
  db.update(entrySections)
    .set({ content, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(entrySections.id, sectionId))
    .run()
}
