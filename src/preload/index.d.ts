import { ElectronAPI } from '@electron-toolkit/preload'

type DbOpenResult = { success: true } | { success: false; error: string }

interface DbApi {
  open: (password: string) => Promise<DbOpenResult>
  close: () => Promise<void>
  isUnlocked: () => Promise<boolean>
}

interface Api {
  db: DbApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
