import { ipcMain } from 'electron'
import { getSectionsForEntry, updateSectionContent } from '../db/queries/entrySections'
import { getDB } from '../db'
import log from 'electron-log'

export function registerEntrySectionsIpc(): void {
  ipcMain.handle('entrySections:getSectionsForEntry', (_, entryId: number) => {
    try {
      return getSectionsForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to find matching entry', { entryId, error: err })
      throw err
    }
  })
  ipcMain.handle(
    'entrySections:updateSectionContent',
    (_, sectionId: number, newContent: string) => {
      try {
        updateSectionContent(getDB(), sectionId, newContent)
      } catch (err) {
        log.error('Failed to update section content', { sectionId, error: err })
        throw err
      }
    }
  )
}
