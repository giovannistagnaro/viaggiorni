import { sql } from 'drizzle-orm'
import { DrizzleDB } from './database'
import { settings, moodTags, template, templateSections, templateWidgets } from './schema'
import { DEFAULT_MOOD_TAGS, widgetTypes, writingTypes } from './dbConstants'

const DEFAULT_WRITING_SECTIONS: {
  type: (typeof writingTypes)[number]
  label: string
  position: number
}[] = [
  { type: 'daily_summary', label: 'Daily Summary', position: 0 },
  { type: 'gratitude', label: 'Gratitude', position: 1 },
  { type: 'writing_prompt', label: 'Writing Prompt', position: 2 }
]

const DEFAULT_WIDGET_SECTIONS: {
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

  // default writing sections
  db.insert(templateSections)
    .values(
      DEFAULT_WRITING_SECTIONS.map((section) => ({
        templateId: insertedTemplate.id,
        type: section.type,
        label: section.label,
        position: section.position,
        isVisible: true,
        createdAt: sql`(CURRENT_TIMESTAMP)`
      }))
    )
    .run()

  // default widget sections
  db.insert(templateWidgets)
    .values(
      DEFAULT_WIDGET_SECTIONS.map((section) => ({
        templateId: insertedTemplate.id,
        type: section.type,
        position: section.position,
        isVisible: true,
        createdAt: sql`(CURRENT_TIMESTAMP)`
      }))
    )
    .run()
}
