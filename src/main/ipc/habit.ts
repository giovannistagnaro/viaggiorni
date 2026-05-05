import { ipcMain } from 'electron'
import { getDB } from '../db'
import {
  archiveHabit,
  calculateStreak,
  createHabit,
  getActiveHabits,
  getHabitLogForDate,
  pauseHabit,
  resumeHabit,
  toggleHabitCompleted,
  unarchiveHabit,
  updateHabit
} from '../db/queries/habits'
import log from 'electron-log'

export function registerHabitIpc(): void {
  ipcMain.handle('habit:getActiveHabits', () => {
    try {
      return getActiveHabits(getDB())
    } catch (err) {
      log.error('Failed to get active habits', { error: err })
      throw err
    }
  })

  ipcMain.handle('habit:createHabit', (_, name: string, color: string) => {
    try {
      return createHabit(getDB(), name, color)
    } catch (err) {
      log.error('Failed to create habit', { error: err })
      throw err
    }
  })

  ipcMain.handle('habit:archiveHabit', (_, habitId: number) => {
    try {
      return archiveHabit(getDB(), habitId)
    } catch (err) {
      log.error('Failed to archive habit', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle('habit:unarchiveHabit', (_, habitId: number) => {
    try {
      return unarchiveHabit(getDB(), habitId)
    } catch (err) {
      log.error('Failed to unarchive habit', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle('habit:updateHabit', (_, habitId: number, name: string, color: string) => {
    try {
      return updateHabit(getDB(), habitId, name, color)
    } catch (err) {
      log.error('Failed to update habit', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle('habit:getHabitLogForDate', (_, habitId: number, date: string) => {
    try {
      return getHabitLogForDate(getDB(), habitId, date)
    } catch (err) {
      log.error('Failed to get habit for specific date', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle('habit:toggleHabitCompleted', (_, habitId: number, date: string) => {
    try {
      return toggleHabitCompleted(getDB(), habitId, date)
    } catch (err) {
      log.error('Failed to toggle habit complete', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle('habit:pauseHabit', (_, habitId: number, startDate: string) => {
    try {
      return pauseHabit(getDB(), habitId, startDate)
    } catch (err) {
      log.error('Failed to pause habit', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle('habit:resumeHabit', (_, habitId: number, endDate: string) => {
    try {
      return resumeHabit(getDB(), habitId, endDate)
    } catch (err) {
      log.error('Failed to resume habit', { habitId, error: err })
      throw err
    }
  })

  ipcMain.handle(
    'habit:calculateStreak',
    (_, habitId: number, today: string, tolerance: number) => {
      try {
        return calculateStreak(getDB(), habitId, today, tolerance)
      } catch (err) {
        log.error('Failed to calculate streak', { habitId, error: err })
        throw err
      }
    }
  )
}
