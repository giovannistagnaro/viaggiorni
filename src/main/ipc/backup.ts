import { ipcMain } from 'electron'
import { exportBackup, importBackup } from '../backup'
import log from 'electron-log'
import { ExportResult, ImportResult } from '@shared/types'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:exportBackup', async (): Promise<ExportResult> => {
    try {
      return await exportBackup()
    } catch (err) {
      log.error('Failed to export backup', { error: err })
      throw err
    }
  })

  ipcMain.handle('backup:importBackup', async (): Promise<ImportResult> => {
    try {
      return await importBackup()
    } catch (err) {
      log.error('Failed to import backup', { error: err })
      throw err
    }
  })
}
