import { app, dialog } from 'electron'
import { join } from 'path'
import AdmZip from 'adm-zip'
import { existsSync, rmSync } from 'fs'
import log from 'electron-log'
import {
  CURRENT_SCHEMA_VERSION,
  DB_FILE_NAME,
  PHOTOS_DIR_NAME,
  SALT_FILE_NAME,
  USERNAME_FILE_NAME
} from './db/dbConstants'
import { closeDBWrapper } from './db'
import { ExportResult, ImportResult } from '@shared/types'

const MANIFEST_FILE_NAME = 'manifest.json'

const REQUIRED_ENTRIES = [DB_FILE_NAME, SALT_FILE_NAME]

export async function exportBackup(): Promise<ExportResult> {
  const result = await dialog.showSaveDialog({
    title: 'Choose where to export backup',
    defaultPath: 'viaggiorni-backup.zip'
  })
  if (result.canceled || !result.filePath) return { success: false, reason: 'cancelled' }

  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, DB_FILE_NAME)
  const saltPath = join(userDataPath, SALT_FILE_NAME)
  const usernamePath = join(userDataPath, USERNAME_FILE_NAME)
  const photosDir = join(userDataPath, PHOTOS_DIR_NAME)

  try {
    const zip = new AdmZip()
    if (existsSync(dbPath)) zip.addLocalFile(dbPath)
    if (existsSync(saltPath)) zip.addLocalFile(saltPath)
    if (existsSync(usernamePath)) zip.addLocalFile(usernamePath)
    if (existsSync(photosDir)) zip.addLocalFolder(photosDir, PHOTOS_DIR_NAME)

    const manifest = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appVersion: app.getVersion(),
      exportedAt: new Date().toISOString()
    }
    zip.addFile(MANIFEST_FILE_NAME, Buffer.from(JSON.stringify(manifest, null, 2)))

    zip.writeZip(result.filePath)
    return { success: true, path: result.filePath }
  } catch (err) {
    log.error('Failed to write backup zip', { error: err })
    return { success: false, reason: 'write_failed' }
  }
}

export async function importBackup(): Promise<ImportResult> {
  const pick = await dialog.showOpenDialog({
    title: 'Choose backup file to import',
    properties: ['openFile'],
    filters: [{ name: 'Viaggiorni backup', extensions: ['zip'] }]
  })
  if (pick.canceled || !pick.filePaths[0]) return { success: false, reason: 'cancelled' }

  let zip: AdmZip
  try {
    zip = new AdmZip(pick.filePaths[0])
  } catch (err) {
    log.error('Failed to read backup zip', { error: err })
    return { success: false, reason: 'invalid_zip' }
  }

  const entryNames = zip.getEntries().map((e) => e.entryName)
  for (const required of REQUIRED_ENTRIES) {
    if (!entryNames.includes(required)) return { success: false, reason: 'missing_required' }
  }

  // Refuse imports from a newer schema than the running app supports.
  const manifestEntry = zip.getEntry(MANIFEST_FILE_NAME)
  if (manifestEntry) {
    try {
      const manifest = JSON.parse(manifestEntry.getData().toString('utf8'))
      if (
        typeof manifest.schemaVersion === 'number' &&
        manifest.schemaVersion > CURRENT_SCHEMA_VERSION
      ) {
        return { success: false, reason: 'newer_schema' }
      }
    } catch {
      // unreadable manifest — treat as missing, fall through to import
    }
  }

  const confirm = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Cancel', 'Replace'],
    defaultId: 0,
    cancelId: 0,
    title: 'Replace existing data?',
    message: 'Importing will replace all current journal data. This cannot be undone.'
  })
  if (confirm.response === 0) return { success: false, reason: 'cancelled' }

  // Close current DB so we can replace its file
  closeDBWrapper()

  try {
    const userDataPath = app.getPath('userData')
    for (const name of [DB_FILE_NAME, SALT_FILE_NAME, USERNAME_FILE_NAME]) {
      const path = join(userDataPath, name)
      if (existsSync(path)) rmSync(path)
    }
    const photosDir = join(userDataPath, PHOTOS_DIR_NAME)
    if (existsSync(photosDir)) rmSync(photosDir, { recursive: true, force: true })

    zip.extractAllTo(userDataPath, /* overwrite */ true)
    return { success: true }
  } catch (err) {
    log.error('Failed to extract backup', { error: err })
    return { success: false, reason: 'extract_failed' }
  }
}
