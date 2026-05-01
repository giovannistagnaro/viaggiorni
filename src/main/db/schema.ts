import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { widgetTypes, writingTypes } from './dbConstants'

// app user settings
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  theme: text('theme').notNull().default('light'),
  passwordHash: text('password_hash').notNull(),
  streakTolerance: integer('streak_tolerance').notNull().default(0),
  ollamaModel: text('ollama_model'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
})

// journal entries
export const entries = sqliteTable('entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  date: text('date')
    .notNull()
    .default(sql`(CURRENT_DATE)`),
  isBookmarked: integer('is_bookmarked', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
})

// sections of the writing portion of the page
export const entrySections = sqliteTable('entry_sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id')
    .notNull()
    .references(() => entries.id),
  type: text('type', {
    enum: writingTypes
  }).notNull(),
  label: text('label'),
  content: text('content'),
  position: integer('position').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
})

// widgets of the left side of the page
export const entryWidgets = sqliteTable('entry_widgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id')
    .notNull()
    .references(() => entries.id),
  type: text('type', {
    enum: widgetTypes
  }).notNull(),
  position: integer('position').notNull(),
  colSpan: integer('col_span').notNull().default(2),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// user-created template for daily entries
export const template = sqliteTable('template', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
})

// templates for right side of entry
export const templateSections = sqliteTable('template_sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => template.id),
  type: text('type', {
    enum: writingTypes
  }).notNull(),
  label: text('label'),
  position: integer('position').notNull(),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// templates for left side of entry
export const templateWidgets = sqliteTable('template_widgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => template.id),
  type: text('type', {
    enum: widgetTypes
  }).notNull(),
  position: integer('position').notNull(),
  colSpan: integer('col_span').notNull().default(2),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// user-defined habits to track
export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
})

// daily completion records for habits
export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id')
    .notNull()
    .references(() => habits.id),
  entryDate: text('entry_date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// date ranges during which a habit is paused
export const habitPauses = sqliteTable('habit_pauses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id')
    .notNull()
    .references(() => habits.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// mood tags available for selection
export const moodTags = sqliteTable('mood_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// mood tags selected for a given entry
export const entryMoodTags = sqliteTable('entry_mood_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id')
    .notNull()
    .references(() => entries.id),
  tagId: integer('tag_id')
    .notNull()
    .references(() => moodTags.id)
})

// todos linked by date, not entry
export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryDate: text('entry_date').notNull(),
  label: text('label').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
})

// photos attached to entries, stored as encrypted files on disk
export const entryPhotos = sqliteTable('entry_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id')
    .notNull()
    .references(() => entries.id),
  filePath: text('file_path').notNull(),
  caption: text('caption'),
  position: integer('position').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

// word of the day, one per date
export const wordOfDay = sqliteTable('word_of_day', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryDate: text('entry_date').notNull(),
  word: text('word').notNull(),
  definition: text('definition').notNull(),
  example: text('example'),
  source: text('source', { enum: ['local', 'ollama'] }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})
