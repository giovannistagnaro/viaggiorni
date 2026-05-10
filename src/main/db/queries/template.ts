import { TemplateWidget, TemplateWriting, WidgetType, WritingType } from '@shared/types'
import { DrizzleDB } from '../database'
import { template, templateWidgets, templateWritings } from '../schemas/schema'
import { and, desc, eq, gt, gte, lt, lte, max, sql } from 'drizzle-orm'

export function getActiveTemplate(db: DrizzleDB): {
  widgets: TemplateWidget[]
  writings: TemplateWriting[]
} {
  const activeTemplate = db.select().from(template).orderBy(desc(template.id)).limit(1).get()
  if (!activeTemplate) throw new Error('Template not found')

  const widgets = db
    .select()
    .from(templateWidgets)
    .where(eq(templateWidgets.templateId, activeTemplate.id))
    .orderBy(templateWidgets.position)
    .all()

  const writings = db
    .select()
    .from(templateWritings)
    .where(eq(templateWritings.templateId, activeTemplate.id))
    .orderBy(templateWritings.position)
    .all()

  return { widgets, writings }
}

export function addTemplateWriting(
  db: DrizzleDB,
  templateId: number,
  type: WritingType,
  label: string | null
): TemplateWriting {
  return db.transaction((tx) => {
    const exists = tx
      .select({ id: template.id })
      .from(template)
      .where(eq(template.id, templateId))
      .get()
    if (!exists) throw new Error('Template not found')

    const maxRow = tx
      .select({ max: sql<number>`COALESCE(MAX(${templateWritings.position}), -1)` })
      .from(templateWritings)
      .where(eq(templateWritings.templateId, templateId))
      .get()

    const position = (maxRow?.max ?? -1) + 1

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, templateId))
      .run()

    return tx
      .insert(templateWritings)
      .values({ templateId, type, label, position, isVisible: true })
      .returning()
      .get()
  })
}

export function removeTemplateWriting(db: DrizzleDB, writingId: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: templateWritings.position, templateId: templateWritings.templateId })
      .from(templateWritings)
      .where(eq(templateWritings.id, writingId))
      .get()

    if (!row) throw new Error('Template writing not found')

    tx.delete(templateWritings).where(eq(templateWritings.id, writingId)).run()

    // shift remaining writings in this template down by 1
    tx.update(templateWritings)
      .set({ position: sql`${templateWritings.position} - 1` })
      .where(
        and(
          eq(templateWritings.templateId, row.templateId),
          gt(templateWritings.position, row.position)
        )
      )
      .run()

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, row.templateId))
      .run()
  })
}

export function updateTemplateWriting(
  db: DrizzleDB,
  writingId: number,
  label: string | null,
  isVisible: boolean
): void {
  db.transaction((tx) => {
    const row = tx
      .select({ templateId: templateWritings.templateId })
      .from(templateWritings)
      .where(eq(templateWritings.id, writingId))
      .get()

    if (!row) throw new Error('Template writing not found')

    tx.update(templateWritings)
      .set({ label, isVisible })
      .where(eq(templateWritings.id, writingId))
      .run()

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, row.templateId))
      .run()
  })
}

export function changeTemplateWritingPosition(
  db: DrizzleDB,
  writingId: number,
  newPosition: number
): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: templateWritings.position, templateId: templateWritings.templateId })
      .from(templateWritings)
      .where(eq(templateWritings.id, writingId))
      .get()

    if (!row) throw new Error('Template writing not found')

    const maxRow = tx
      .select({ maxPosition: max(templateWritings.position) })
      .from(templateWritings)
      .where(eq(templateWritings.templateId, row.templateId))
      .get()

    const maxPosition = maxRow?.maxPosition ?? 1
    newPosition = Math.max(0, Math.min(newPosition, maxPosition))

    const oldPosition = row.position

    if (newPosition > oldPosition) {
      tx.update(templateWritings)
        .set({ position: sql`${templateWritings.position} - 1` })
        .where(
          and(
            eq(templateWritings.templateId, row.templateId),
            gt(templateWritings.position, oldPosition),
            lte(templateWritings.position, newPosition)
          )
        )
        .run()
    } else if (newPosition < oldPosition) {
      tx.update(templateWritings)
        .set({ position: sql`${templateWritings.position} + 1` })
        .where(
          and(
            eq(templateWritings.templateId, row.templateId),
            lt(templateWritings.position, oldPosition),
            gte(templateWritings.position, newPosition)
          )
        )
        .run()
    } else {
      return
    }

    tx.update(templateWritings)
      .set({ position: newPosition })
      .where(eq(templateWritings.id, writingId))
      .run()

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, row.templateId))
      .run()
  })
}

export function addTemplateWidget(
  db: DrizzleDB,
  templateId: number,
  type: WidgetType,
  colSpan: number = 2
): TemplateWidget {
  return db.transaction((tx) => {
    const exists = tx
      .select({ id: template.id })
      .from(template)
      .where(eq(template.id, templateId))
      .get()
    if (!exists) throw new Error('Template not found')

    const maxRow = tx
      .select({ max: sql<number>`COALESCE(MAX(${templateWidgets.position}), -1)` })
      .from(templateWidgets)
      .where(eq(templateWidgets.templateId, templateId))
      .get()

    const position = (maxRow?.max ?? -1) + 1

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, templateId))
      .run()

    return tx
      .insert(templateWidgets)
      .values({ templateId, type, position, colSpan, isVisible: true })
      .returning()
      .get()
  })
}

export function removeTemplateWidget(db: DrizzleDB, widgetId: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: templateWidgets.position, templateId: templateWidgets.templateId })
      .from(templateWidgets)
      .where(eq(templateWidgets.id, widgetId))
      .get()

    if (!row) throw new Error('Template widget not found')

    tx.delete(templateWidgets).where(eq(templateWidgets.id, widgetId)).run()

    // shift remaining widgets in this template down by 1
    tx.update(templateWidgets)
      .set({ position: sql`${templateWidgets.position} - 1` })
      .where(
        and(
          eq(templateWidgets.templateId, row.templateId),
          gt(templateWidgets.position, row.position)
        )
      )
      .run()

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, row.templateId))
      .run()
  })
}

export function updateTemplateWidget(
  db: DrizzleDB,
  widgetId: number,
  colSpan: number,
  isVisible: boolean
): void {
  db.transaction((tx) => {
    const row = tx
      .select({ templateId: templateWidgets.templateId })
      .from(templateWidgets)
      .where(eq(templateWidgets.id, widgetId))
      .get()

    if (!row) throw new Error('Template widget not found')

    tx.update(templateWidgets)
      .set({ colSpan, isVisible })
      .where(eq(templateWidgets.id, widgetId))
      .run()

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, row.templateId))
      .run()
  })
}

export function changeTemplateWidgetPosition(
  db: DrizzleDB,
  widgetId: number,
  newPosition: number
): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: templateWidgets.position, templateId: templateWidgets.templateId })
      .from(templateWidgets)
      .where(eq(templateWidgets.id, widgetId))
      .get()

    if (!row) throw new Error('Template widget not found')

    const maxRow = tx
      .select({ maxPosition: max(templateWidgets.position) })
      .from(templateWidgets)
      .where(eq(templateWidgets.templateId, row.templateId))
      .get()

    const maxPosition = maxRow?.maxPosition ?? 1
    newPosition = Math.max(0, Math.min(newPosition, maxPosition))

    const oldPosition = row.position

    if (newPosition > oldPosition) {
      tx.update(templateWidgets)
        .set({ position: sql`${templateWidgets.position} - 1` })
        .where(
          and(
            eq(templateWidgets.templateId, row.templateId),
            gt(templateWidgets.position, oldPosition),
            lte(templateWidgets.position, newPosition)
          )
        )
        .run()
    } else if (newPosition < oldPosition) {
      tx.update(templateWidgets)
        .set({ position: sql`${templateWidgets.position} + 1` })
        .where(
          and(
            eq(templateWidgets.templateId, row.templateId),
            lt(templateWidgets.position, oldPosition),
            gte(templateWidgets.position, newPosition)
          )
        )
        .run()
    } else {
      return
    }

    tx.update(templateWidgets)
      .set({ position: newPosition })
      .where(eq(templateWidgets.id, widgetId))
      .run()

    tx.update(template)
      .set({ updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(template.id, row.templateId))
      .run()
  })
}
