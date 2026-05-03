import { ElectronAPI } from '@electron-toolkit/preload'

type DbOpenResult = { success: true } | { success: false; error: string }

interface DbApi {
  open: (password: string) => Promise<DbOpenResult>
  close: () => Promise<void>
  isUnlocked: () => Promise<boolean>
  isFirstLaunch: () => Promise<boolean>
}

interface userApi {
  getUsername: () => Promise<string>
  setUsername: (name: string) => Promise<void>
}

interface Api {
  db: DbApi
  user: userApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
