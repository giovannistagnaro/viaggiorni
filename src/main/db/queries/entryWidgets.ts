import { EntryWidget } from '@shared/types'
import { DrizzleDB } from '../database'
import { entryWidgets } from '../schema'
import { asc, eq } from 'drizzle-orm'

export function getWidgetsForEntry(db: DrizzleDB, entryId: number): EntryWidget[] {
  return db
    .select()
    .from(entryWidgets)
    .where(eq(entryWidgets.entryId, entryId))
    .orderBy(asc(entryWidgets.position))
    .all()
}
