import { sql } from 'drizzle-orm'
import { DrizzleDB } from './database'
import { settings, moodTags, template, templateWritings, templateWidgets } from './schema'
import { DEFAULT_MOOD_TAGS, widgetTypes, writingTypes } from './dbConstants'

const DEFAULT_TEMPLATE_WRITINGS: {
  type: (typeof writingTypes)[number]
  label: string
  position: number
}[] = [
  { type: 'daily_summary', label: 'Daily Summary', position: 0 },
  { type: 'gratitude', label: 'Gratitude', position: 1 },
  { type: 'writing_prompt', label: 'Writing Prompt', position: 2 }
]

const DEFAULT_TEMPLATE_WIDGETS: {
  type: (typeof widgetTypes)[number]
  position: number
}[] = [
  { type: 'mood_tracker', position: 0 },
  { type: 'habit_tracker', position: 1 },
  { type: 'todo_list', position: 2 }
]

export function seedDatabase(db: DrizzleDB): void {
  const settingsIsEmpty = db.select().from(settings).limit(1).all().length === 0

  if (!settingsIsEmpty) return

  // seed default settings
  db.insert(settings)
    .values({
      name: 'User',
      createdAt: sql`(CURRENT_TIMESTAMP)`
    })
    .run()

  // seed default mood tags
  db.insert(moodTags)
    .values(
      DEFAULT_MOOD_TAGS.map((label) => ({
        label,
        isDefault: true,
        createdAt: sql`(CURRENT_TIMESTAMP)`
      }))
    )
    .run()

  // default journal template
  const insertedTemplate = db
    .insert(template)
    .values({ name: 'Default', createdAt: sql`(CURRENT_TIMESTAMP)` })
    .returning({ id: template.id })
    .get()

  // default template writings
  db.insert(templateWritings)
    .values(
      DEFAULT_TEMPLATE_WRITINGS.map((writing) => ({
        templateId: insertedTemplate.id,
        type: writing.type,
        label: writing.label,
        position: writing.position,
        isVisible: true,
        createdAt: sql`(CURRENT_TIMESTAMP)`
      }))
    )
    .run()

  // default template widgets
  db.insert(templateWidgets)
    .values(
      DEFAULT_TEMPLATE_WIDGETS.map((widget) => ({
        templateId: insertedTemplate.id,
        type: widget.type,
        position: widget.position,
        isVisible: true,
        createdAt: sql`(CURRENT_TIMESTAMP)`
      }))
    )
    .run()
}
