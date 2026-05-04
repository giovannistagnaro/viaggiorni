import { ipcMain } from 'electron'
import { getWidgetsForEntry } from '../db/queries/entryWidgets'
import { getDB } from '../db'
import log from 'electron-log'

export function registerEntryWidgetsIpc(): void {
  ipcMain.handle('entryWidgets:getWidgetsForEntry', (_, entryId: number) => {
    try {
      return getWidgetsForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to find matching entry for widgets', { entryId, error: err })
      throw err
    }
  })
}
