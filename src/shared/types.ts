import type {
  entries,
  entryWritings,
  entryWidgets,
  habits,
  habitLogs,
  habitPauses,
  moodTags,
  todos,
  entryPhotos,
  wordOfDay,
  template,
  templateWritings,
  templateWidgets,
  settings
} from '../main/db/schema'

export type Entry = typeof entries.$inferSelect
export type EntryWriting = typeof entryWritings.$inferSelect
export type EntryWidget = typeof entryWidgets.$inferSelect
export type Habit = typeof habits.$inferSelect
export type HabitLog = typeof habitLogs.$inferSelect
export type HabitPause = typeof habitPauses.$inferSelect
export type MoodTag = typeof moodTags.$inferSelect
export type Todo = typeof todos.$inferSelect
export type EntryPhoto = typeof entryPhotos.$inferSelect
export type WordOfDay = typeof wordOfDay.$inferSelect
export type Template = typeof template.$inferSelect
export type TemplateWriting = typeof templateWritings.$inferSelect
export type TemplateWidget = typeof templateWidgets.$inferSelect
export type Settings = typeof settings.$inferSelect
