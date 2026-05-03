import { ipcMain } from 'electron'
import { getSectionsForEntry, updateSectionContent } from '../db/queries/entrySections'
import { getDB } from '../db'

export function registerEntrySectionsIpc(): void {
  ipcMain.handle('entrySections:getSectionsForEntry', (_, entryId: number) =>
    getSectionsForEntry(getDB(), entryId)
  )
  ipcMain.handle('entrySections:updateSectionContent', (_, sectionId: number, newContent: string) =>
    updateSectionContent(getDB(), sectionId, newContent)
  )
}
