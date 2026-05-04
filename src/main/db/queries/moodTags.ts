import { MoodTag } from '@shared/types'
import { DrizzleDB } from '../database'
import { entryMoodTags, moodTags } from '../schema'
import { and, eq, getTableColumns, sql } from 'drizzle-orm'

export function getAllMoodTags(db: DrizzleDB): MoodTag[] {
  return db.select().from(moodTags).orderBy(moodTags.label).all()
}

export function getMoodTagsForEntry(db: DrizzleDB, entryId: number): MoodTag[] {
  return db
    .select(getTableColumns(moodTags))
    .from(entryMoodTags)
    .innerJoin(moodTags, eq(moodTags.id, entryMoodTags.tagId))
    .where(eq(entryMoodTags.entryId, entryId))
    .all()
}

export function addMoodTagToEntry(db: DrizzleDB, entryId: number, tagId: number): void {
  db.transaction((tx) => {
    const row = tx
      .select()
      .from(entryMoodTags)
      .where(and(eq(entryMoodTags.entryId, entryId), eq(entryMoodTags.tagId, tagId)))
      .get()

    if (!row) tx.insert(entryMoodTags).values({ entryId, tagId }).run()
  })
}

export function removeMoodTagFromEntry(db: DrizzleDB, entryId: number, tagId: number): void {
  db.delete(entryMoodTags)
    .where(and(eq(entryMoodTags.entryId, entryId), eq(entryMoodTags.tagId, tagId)))
    .run()
}

export function removeMoodTag(db: DrizzleDB, tagId: number): void {
  db.transaction((tx) => {
    tx.delete(entryMoodTags).where(eq(entryMoodTags.tagId, tagId)).run()
    tx.delete(moodTags).where(eq(moodTags.id, tagId)).run()
  })
}

export function createMoodTag(db: DrizzleDB, label: string): void {
  db.transaction((tx) => {
    const row = tx
      .select()
      .from(moodTags)
      .where(sql`LOWER(${moodTags.label}) = LOWER(${label})`)
      .get()

    if (!row) tx.insert(moodTags).values({ label }).run()
  })
}
