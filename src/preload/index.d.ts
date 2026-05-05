import { ElectronAPI } from '@electron-toolkit/preload'
import { Entry, EntryWriting, EntryWidget, Todo, MoodTag, Habit, HabitLog } from '@shared/types'

type DbOpenResult = { success: true } | { success: false; error: string }

interface DbApi {
  open: (password: string) => Promise<DbOpenResult>
  close: () => Promise<void>
  isUnlocked: () => Promise<boolean>
  isFirstLaunch: () => Promise<boolean>
}

interface UserApi {
  getUsername: () => Promise<string>
  setUsername: (name: string) => Promise<void>
}

interface EntriesApi {
  getByDate: (date: string) => Promise<Entry | null>
  create: (date: string, title: string) => Promise<Entry>
  updateTitle: (id: number, title: string) => Promise<void>
  toggleBookmark: (id: number) => Promise<void>
  getAllBookmarked: () => Promise<Entry[]>
}

interface EntryWritingsApi {
  getWritingsForEntry: (entryId: number) => Promise<EntryWriting[]>
  updateWritingContent: (writingId: number, newContent: string) => Promise<void>
}

interface EntryWidgetsApi {
  getWidgetsForEntry: (entryId: number) => Promise<EntryWidget[]>
}

interface TodosApi {
  createTodo: (entryDate: string, label: string) => Promise<Todo>
  getTodosForDate: (entryDate: string) => Promise<Todo[]>
  toggleTodoCompleted: (todoId: number) => Promise<void>
  deleteTodo: (todoId: number) => Promise<void>
  updateTodoLabel: (todoId: number, newLabel: string) => Promise<void>
  changeTodoPosition: (todoId: number, newPosition: number) => Promise<void>
}

interface MoodTagsApi {
  getAllMoodTags: () => Promise<MoodTag[]>
  getMoodTagsForEntry: (entryId: number) => Promise<MoodTag[]>
  addMoodTagToEntry: (entryId: number, tagId: number) => Promise<void>
  removeMoodTagFromEntry: (entryId: number, tagId: number) => Promise<void>
  removeMoodTag: (tagId: number) => Promise<void>
  createMoodTag: (label: string) => Promise<void>
}

interface HabitApi {
  getActiveHabits: () => Promise<Habit[]>
  createHabit: (name: string, color: string) => Promise<Habit | null>
  archiveHabit: (habitId: number) => Promise<void>
  unarchiveHabit: (habitId: number) => Promise<void>
  updateHabit: (habitId: number, name: string, color: string) => Promise<void>
  getHabitLogForDate: (habitId: number, date: string) => Promise<HabitLog | null>
  toggleHabitCompleted: (habitId: number, date: string) => Promise<void>
  pauseHabit: (habitId: number, startDate: string) => Promise<void>
  resumeHabit: (habitId: number, endDate: string) => Promise<void>
  calculateStreak: (habitId: number, today: string, tolerance: number) => Promise<number>
}

interface Api {
  db: DbApi
  user: UserApi
  entries: EntriesApi
  entryWritings: EntryWritingsApi
  entryWidgets: EntryWidgetsApi
  todos: TodosApi
  moodTags: MoodTagsApi
  habit: HabitApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
