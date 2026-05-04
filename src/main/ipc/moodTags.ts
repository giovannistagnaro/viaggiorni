import { ipcMain } from 'electron'
import log from 'electron-log'
import { getDB } from '../db'
import {
  addMoodTagToEntry,
  createMoodTag,
  getAllMoodTags,
  getMoodTagsForEntry,
  removeMoodTag,
  removeMoodTagFromEntry
} from '../db/queries/moodTags'

export function registerMoodTagsIpc(): void {
  ipcMain.handle('moodTags:getAllMoodTags', () => {
    try {
      return getAllMoodTags(getDB())
    } catch (err) {
      log.error('Failed to get all mood tags', { error: err })
      throw err
    }
  })
  ipcMain.handle('moodTags:getMoodTagsForEntry', (_, entryId: number) => {
    try {
      return getMoodTagsForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to get mood tags for entry', { entryId, error: err })
      throw err
    }
  })
  ipcMain.handle('moodTags:addMoodTagToEntry', (_, entryId: number, tagId: number) => {
    try {
      return addMoodTagToEntry(getDB(), entryId, tagId)
    } catch (err) {
      log.error('Failed to add mood tag to entry', { entryId, tagId, error: err })
      throw err
    }
  })
  ipcMain.handle('moodTags:removeMoodTagFromEntry', (_, entryId: number, tagId: number) => {
    try {
      return removeMoodTagFromEntry(getDB(), entryId, tagId)
    } catch (err) {
      log.error('Failed to remove mood tag from entry', { entryId, tagId, error: err })
      throw err
    }
  })
  ipcMain.handle('moodTags:removeMoodTag', (_, tagId: number) => {
    try {
      return removeMoodTag(getDB(), tagId)
    } catch (err) {
      log.error('Failed to remove mood tag', { tagId, error: err })
      throw err
    }
  })
  ipcMain.handle('moodTags:createMoodTag', (_, label: string) => {
    try {
      return createMoodTag(getDB(), label)
    } catch (err) {
      log.error('Failed to create mood tag', { error: err })
      throw err
    }
  })
}
