import { ipcMain } from 'electron'
import { getWritingsForEntry, updateWritingContent } from '../db/queries/entryWritings'
import { getDB } from '../db'
import log from 'electron-log'

export function registerEntryWritingsIpc(): void {
  ipcMain.handle('entryWritings:getWritingsForEntry', (_, entryId: number) => {
    try {
      return getWritingsForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to find matching entry for writings', { entryId, error: err })
      throw err
    }
  })
  ipcMain.handle(
    'entryWritings:updateWritingContent',
    (_, writingId: number, newContent: string) => {
      try {
        updateWritingContent(getDB(), writingId, newContent)
      } catch (err) {
        log.error('Failed to update writing content', { writingId, error: err })
        throw err
      }
    }
  )
}
