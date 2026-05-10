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
} from '../main/db/schemas/schema'
import { WIDGET_TYPES, WRITING_TYPES } from './constants'

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

export type WritingType = (typeof WRITING_TYPES)[number]
export type WidgetType = (typeof WIDGET_TYPES)[number]

export type WordOfDayItem = { word: string; definition: string; example: string }
export type WritingPromptItem = { prompt: string }
export type PhotoItem = { dataUrl: string; caption: string | null } | null
export type ActiveTemplate = {
  id: number
  widgets: TemplateWidget[]
  writings: TemplateWriting[]
}

export type Theme = 'light' | 'dark'

export type GenerationSource = 'local' | 'ollama'
export type SafeReturnSettings = Omit<Settings, 'encryptionKey'>

export type ExportResult =
  | { success: true; path: string }
  | { success: false; reason: 'cancelled' | 'write_failed' }

export type ImportResult =
  | { success: true }
  | {
      success: false
      reason: 'cancelled' | 'invalid_zip' | 'missing_required' | 'newer_schema' | 'extract_failed'
    }
