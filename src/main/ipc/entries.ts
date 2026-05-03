import { ipcMain } from 'electron'
import { getDB } from '../db'
import {
  getEntryByDate,
  createEntry,
  updateEntryTitle,
  toggleBookmark,
  getAllBookmarkedEntries
} from '../db/queries/entries'

export function registerEntriesIpc(): void {
  ipcMain.handle('entries:getByDate', (_, date: string) => getEntryByDate(getDB(), date))
  ipcMain.handle('entries:create', (_, date: string, title: string) =>
    createEntry(getDB(), date, title)
  )
  ipcMain.handle('entries:updateTitle', (_, id: number, title: string) =>
    updateEntryTitle(getDB(), id, title)
  )
  ipcMain.handle('entries:toggleBookmark', (_, id: number) => toggleBookmark(getDB(), id))
  ipcMain.handle('entries:getAllBookmarked', () => getAllBookmarkedEntries(getDB()))
}
