import { eq, desc, sql, asc } from 'drizzle-orm'
import type { DrizzleDB } from '../database'
import {
  entries,
  entryWritings,
  entryWidgets,
  template,
  templateWritings,
  templateWidgets
} from '../schemas/schema'
import { Entry } from '@shared/types'

export function getEntryByDate(db: DrizzleDB, date: string): Entry | null {
  const entriesByDate = db.select().from(entries).where(eq(entries.date, date)).limit(1).all()
  if (entriesByDate.length < 1) return null
  else return entriesByDate[0]
}

export function createEntry(db: DrizzleDB, date: string, title: string): Entry {
  return db.transaction((tx) => {
    const newEntry = tx.insert(entries).values({ title, date }).returning().get()
    const activeTemplate = tx.select().from(template).orderBy(desc(template.id)).limit(1).get()

    if (!activeTemplate) {
      throw new Error('No template found')
    }

    const activeWritings = tx
      .select()
      .from(templateWritings)
      .where(eq(templateWritings.templateId, activeTemplate.id))
      .all()
    const activeWidgets = tx
      .select()
      .from(templateWidgets)
      .where(eq(templateWidgets.templateId, activeTemplate.id))
      .all()

    if (activeWritings.length > 0) {
      tx.insert(entryWritings)
        .values(
          activeWritings.map((writing) => ({
            entryId: newEntry.id,
            type: writing.type,
            label: writing.label,
            position: writing.position,
            isVisible: writing.isVisible
          }))
        )
        .run()
    }

    if (activeWidgets.length > 0) {
      tx.insert(entryWidgets)
        .values(
          activeWidgets.map((widget) => ({
            entryId: newEntry.id,
            type: widget.type,
            position: widget.position,
            colSpan: widget.colSpan,
            isVisible: widget.isVisible
          }))
        )
        .run()
    }

    return newEntry
  })
}

export function updateEntryTitle(db: DrizzleDB, id: number, title: string): void {
  db.update(entries)
    .set({ title, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(entries.id, id))
    .run()
}

export function toggleBookmark(db: DrizzleDB, id: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ isBookmarked: entries.isBookmarked })
      .from(entries)
      .where(eq(entries.id, id))
      .get()

    if (!row) throw new Error(`Entry ${id} not found`)

    tx.update(entries).set({ isBookmarked: !row.isBookmarked }).where(eq(entries.id, id)).run()
  })
}

export function getAllBookmarkedEntries(db: DrizzleDB): Entry[] {
  const allBookmarkedEntries = db
    .select()
    .from(entries)
    .where(eq(entries.isBookmarked, true))
    .orderBy(desc(entries.date))
    .all()
  return allBookmarkedEntries
}

export function getAllDates(db: DrizzleDB): string[] {
  const dates = db
    .selectDistinct({ date: entries.date })
    .from(entries)
    .orderBy(asc(entries.date))
    .all()

  return dates.map((dateObj) => dateObj.date)
}
