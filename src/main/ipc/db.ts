import { ipcMain } from 'electron'
import { closeDBWrapper, isUnlocked, openDBWrapper } from '../db'

type DbOpenResult = { success: true } | { success: false; error: string }
const DB_OPEN_FAILURE_MESSAGE = 'Invalid password'

export function registerDbIpc(): void {
  ipcMain.handle('db:open', (_, password: string): DbOpenResult => {
    try {
      openDBWrapper(password)
    } catch {
      return { success: false, error: DB_OPEN_FAILURE_MESSAGE }
    }
    return { success: true }
  })
  ipcMain.handle('db:close', (): void => {
    closeDBWrapper()
  })
  ipcMain.handle('db:isUnlocked', (): boolean => {
    return isUnlocked()
  })
}
