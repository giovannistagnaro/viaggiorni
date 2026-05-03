import { ElectronAPI } from '@electron-toolkit/preload'

type DbOpenResult = { success: true } | { success: false; error: string }
type Entry = {
  id: number
  title: string
  date: string
  isBookmarked: boolean
  createdAt: string
  updatedAt: string | null
}

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

interface Api {
  db: DbApi
  user: UserApi
  entries: EntriesApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
