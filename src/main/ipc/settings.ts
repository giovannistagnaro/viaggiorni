import { ipcMain } from 'electron'
import {
  getSettings,
  updateOllamaModel,
  updateStreakTolerance,
  updateTheme
} from '../db/queries/settings'
import { getDB } from '../db'
import log from 'electron-log'
import { Theme } from '@shared/types'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:getSettings', () => {
    try {
      return getSettings(getDB())
    } catch (err) {
      log.error('Failed to get settings', { error: err })
      throw err
    }
  })

  ipcMain.handle('settings:updateTheme', (_event, theme: Theme) => {
    try {
      updateTheme(getDB(), theme)
    } catch (err) {
      log.error('Failed to update theme', { error: err })
      throw err
    }
  })

  ipcMain.handle('settings:updateStreakTolerance', (_event, tolerance: number) => {
    try {
      updateStreakTolerance(getDB(), tolerance)
    } catch (err) {
      log.error('Failed to update streak tolerance', { error: err })
      throw err
    }
  })

  ipcMain.handle('settings:updateOllamaModel', (_event, model: string) => {
    try {
      updateOllamaModel(getDB(), model)
    } catch (err) {
      log.error('Failed to update Ollama model', { error: err })
      throw err
    }
  })
}
