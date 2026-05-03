import { ElectronAPI } from '@electron-toolkit/preload'
import type { entries, entrySections } from '../main/db/schema'

type DbOpenResult = { success: true } | { success: false; error: string }
type Entry = typeof entries.$inferSelect
type EntrySection = typeof entrySections.$inferSelect

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

interface EntrySectionsApi {
  getSectionsForEntry: (entryId: number) => Promise<EntrySection[]>
  updateSectionContent: (sectionId: number, newContent: string) => Promise<void>
}

interface Api {
  db: DbApi
  user: UserApi
  entries: EntriesApi
  entrySections: EntrySectionsApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
