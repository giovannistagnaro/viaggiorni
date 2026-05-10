import { EntryWidget } from '@shared/types'
import { DrizzleDB } from '../database'
import { entryWidgets } from '../schemas/schema'
import { and, asc, eq, gt, gte, lt, lte, max, sql } from 'drizzle-orm'

export function getWidgetsForEntry(db: DrizzleDB, entryId: number): EntryWidget[] {
  return db
    .select()
    .from(entryWidgets)
    .where(eq(entryWidgets.entryId, entryId))
    .orderBy(asc(entryWidgets.position))
    .all()
}

export function setEntryWidgetVisibility(
  db: DrizzleDB,
  widgetId: number,
  isVisible: boolean
): void {
  const result = db
    .update(entryWidgets)
    .set({ isVisible })
    .where(eq(entryWidgets.id, widgetId))
    .run()

  if (result.changes === 0) throw new Error('Entry widget not found')
}

export function changeEntryWidgetPosition(
  db: DrizzleDB,
  widgetId: number,
  newPosition: number
): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: entryWidgets.position, entryId: entryWidgets.entryId })
      .from(entryWidgets)
      .where(eq(entryWidgets.id, widgetId))
      .get()

    if (!row) throw new Error('Entry widget not found')

    const maxRow = tx
      .select({ maxPosition: max(entryWidgets.position) })
      .from(entryWidgets)
      .where(eq(entryWidgets.entryId, row.entryId))
      .get()

    const maxPosition = maxRow?.maxPosition ?? 1
    newPosition = Math.max(0, Math.min(newPosition, maxPosition))

    const oldPosition = row.position

    if (newPosition > oldPosition) {
      tx.update(entryWidgets)
        .set({ position: sql`${entryWidgets.position} - 1` })
        .where(
          and(
            eq(entryWidgets.entryId, row.entryId),
            gt(entryWidgets.position, oldPosition),
            lte(entryWidgets.position, newPosition)
          )
        )
        .run()
    } else if (newPosition < oldPosition) {
      tx.update(entryWidgets)
        .set({ position: sql`${entryWidgets.position} + 1` })
        .where(
          and(
            eq(entryWidgets.entryId, row.entryId),
            lt(entryWidgets.position, oldPosition),
            gte(entryWidgets.position, newPosition)
          )
        )
        .run()
    } else {
      return
    }

    tx.update(entryWidgets)
      .set({ position: newPosition })
      .where(eq(entryWidgets.id, widgetId))
      .run()
  })
}
