import type {
  entries,
  entrySections,
  entryWidgets,
  habits,
  habitLogs,
  habitPauses,
  moodTags,
  todos,
  entryPhotos,
  wordOfDay,
  template,
  templateSections,
  templateWidgets,
  settings
} from '../main/db/schema'

export type Entry = typeof entries.$inferSelect
export type EntrySection = typeof entrySections.$inferSelect
export type EntryWidget = typeof entryWidgets.$inferSelect
export type Habit = typeof habits.$inferSelect
export type HabitLog = typeof habitLogs.$inferSelect
export type HabitPause = typeof habitPauses.$inferSelect
export type MoodTag = typeof moodTags.$inferSelect
export type Todo = typeof todos.$inferSelect
export type EntryPhoto = typeof entryPhotos.$inferSelect
export type WordOfDay = typeof wordOfDay.$inferSelect
export type Template = typeof template.$inferSelect
export type TemplateSection = typeof templateSections.$inferSelect
export type TemplateWidget = typeof templateWidgets.$inferSelect
export type Settings = typeof settings.$inferSelect
