import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, existsSync, rmSync, mkdirSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import AdmZip from 'adm-zip'
import {
  CURRENT_SCHEMA_VERSION,
  DB_FILE_NAME,
  PHOTOS_DIR_NAME,
  SALT_FILE_NAME,
  USERNAME_FILE_NAME
} from './db/dbConstants'

let userDataPath = ''
const showSaveDialog = vi.fn()
const showOpenDialog = vi.fn()
const showMessageBox = vi.fn()

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'userData') return userDataPath
      throw new Error(`Unexpected getPath: ${name}`)
    },
    getVersion: () => '1.0.0-test'
  },
  dialog: {
    showSaveDialog: (...args: unknown[]) => showSaveDialog(...args),
    showOpenDialog: (...args: unknown[]) => showOpenDialog(...args),
    showMessageBox: (...args: unknown[]) => showMessageBox(...args)
  }
}))

vi.mock('electron-log', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}))

const closeDBWrapper = vi.fn()
vi.mock('./db', () => ({ closeDBWrapper: () => closeDBWrapper() }))

// Import after mocks so the module picks up the mocked electron
import { exportBackup, importBackup } from './backup'

let backupOutPath = ''

beforeEach(() => {
  userDataPath = mkdtempSync(join(tmpdir(), 'viaggiorni-userData-'))
  backupOutPath = join(mkdtempSync(join(tmpdir(), 'viaggiorni-out-')), 'backup.zip')
  showSaveDialog.mockReset()
  showOpenDialog.mockReset()
  showMessageBox.mockReset()
  closeDBWrapper.mockReset()
})

afterEach(() => {
  if (existsSync(userDataPath)) rmSync(userDataPath, { recursive: true, force: true })
  const outDir = join(backupOutPath, '..')
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
})

function seedUserData(
  opts: { db?: boolean; salt?: boolean; username?: boolean; photos?: string[] } = {}
): void {
  const { db = true, salt = true, username = true, photos = [] } = opts
  if (db) writeFileSync(join(userDataPath, DB_FILE_NAME), 'fake-db-bytes')
  if (salt) writeFileSync(join(userDataPath, SALT_FILE_NAME), Buffer.from('saltsalt'))
  if (username) writeFileSync(join(userDataPath, USERNAME_FILE_NAME), 'Giovanni')
  if (photos.length > 0) {
    const photosDir = join(userDataPath, PHOTOS_DIR_NAME)
    mkdirSync(photosDir, { recursive: true })
    for (const name of photos) writeFileSync(join(photosDir, name), `photo-${name}`)
  }
}

describe('exportBackup', () => {
  it('returns cancelled when the user cancels the save dialog', async () => {
    seedUserData()
    showSaveDialog.mockResolvedValue({ canceled: true, filePath: undefined })

    const result = await exportBackup()

    expect(result).toEqual({ success: false, reason: 'cancelled' })
    expect(existsSync(backupOutPath)).toBe(false)
  })

  it('writes a zip containing db, salt, username, photos, and manifest', async () => {
    seedUserData({ photos: ['a.enc', 'b.enc'] })
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: backupOutPath })

    const result = await exportBackup()

    expect(result).toEqual({ success: true, path: backupOutPath })
    const zip = new AdmZip(backupOutPath)
    const names = zip.getEntries().map((e) => e.entryName)
    expect(names).toContain(DB_FILE_NAME)
    expect(names).toContain(SALT_FILE_NAME)
    expect(names).toContain(USERNAME_FILE_NAME)
    expect(names).toContain(`${PHOTOS_DIR_NAME}/a.enc`)
    expect(names).toContain(`${PHOTOS_DIR_NAME}/b.enc`)
    expect(names).toContain('manifest.json')
  })

  it('skips files that do not exist (no username, no photos)', async () => {
    seedUserData({ username: false })
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: backupOutPath })

    const result = await exportBackup()

    expect(result.success).toBe(true)
    const names = new AdmZip(backupOutPath).getEntries().map((e) => e.entryName)
    expect(names).toContain(DB_FILE_NAME)
    expect(names).toContain(SALT_FILE_NAME)
    expect(names).not.toContain(USERNAME_FILE_NAME)
    expect(names.some((n) => n.startsWith(PHOTOS_DIR_NAME))).toBe(false)
  })

  it('writes a manifest with the current schema version', async () => {
    seedUserData()
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: backupOutPath })

    await exportBackup()

    const zip = new AdmZip(backupOutPath)
    const manifest = JSON.parse(zip.getEntry('manifest.json')!.getData().toString('utf8'))
    expect(manifest.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(manifest.appVersion).toBe('1.0.0-test')
    expect(typeof manifest.exportedAt).toBe('string')
  })
})

describe('importBackup', () => {
  // Helper: write a backup zip at backupOutPath with a given schemaVersion
  function writeBackup(
    opts: {
      schemaVersion?: number
      includeDb?: boolean
      includeSalt?: boolean
      includeManifest?: boolean
      photos?: string[]
    } = {}
  ): void {
    const {
      schemaVersion = CURRENT_SCHEMA_VERSION,
      includeDb = true,
      includeSalt = true,
      includeManifest = true,
      photos = []
    } = opts

    const zip = new AdmZip()
    if (includeDb) zip.addFile(DB_FILE_NAME, Buffer.from('imported-db-bytes'))
    if (includeSalt) zip.addFile(SALT_FILE_NAME, Buffer.from('importedsalt'))
    zip.addFile(USERNAME_FILE_NAME, Buffer.from('Imported User'))
    for (const name of photos) {
      zip.addFile(`${PHOTOS_DIR_NAME}/${name}`, Buffer.from(`imported-${name}`))
    }
    if (includeManifest) {
      const manifest = {
        schemaVersion,
        appVersion: '1.0.0-test',
        exportedAt: new Date().toISOString()
      }
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)))
    }
    zip.writeZip(backupOutPath)
  }

  it('returns cancelled when the user cancels the open dialog', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

    const result = await importBackup()

    expect(result).toEqual({ success: false, reason: 'cancelled' })
    expect(closeDBWrapper).not.toHaveBeenCalled()
  })

  it('returns invalid_zip when the chosen file is not a valid zip', async () => {
    writeFileSync(backupOutPath, 'not a zip')
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })

    const result = await importBackup()

    expect(result).toEqual({ success: false, reason: 'invalid_zip' })
    expect(closeDBWrapper).not.toHaveBeenCalled()
  })

  it('returns missing_required when the zip lacks the DB file', async () => {
    writeBackup({ includeDb: false })
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })

    const result = await importBackup()

    expect(result).toEqual({ success: false, reason: 'missing_required' })
  })

  it('returns missing_required when the zip lacks the salt file', async () => {
    writeBackup({ includeSalt: false })
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })

    const result = await importBackup()

    expect(result).toEqual({ success: false, reason: 'missing_required' })
  })

  it('returns newer_schema when the backup schemaVersion is newer than the running app', async () => {
    writeBackup({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 })
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })

    const result = await importBackup()

    expect(result).toEqual({ success: false, reason: 'newer_schema' })
    expect(closeDBWrapper).not.toHaveBeenCalled()
  })

  it('proceeds when the backup schemaVersion is older than the running app', async () => {
    writeBackup({ schemaVersion: Math.max(0, CURRENT_SCHEMA_VERSION - 1) })
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })
    showMessageBox.mockResolvedValue({ response: 1 })

    const result = await importBackup()

    expect(result).toEqual({ success: true })
  })

  it('proceeds when the backup has no manifest at all', async () => {
    writeBackup({ includeManifest: false })
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })
    showMessageBox.mockResolvedValue({ response: 1 })

    const result = await importBackup()

    expect(result).toEqual({ success: true })
  })

  it('returns cancelled when the user declines the destructive confirmation', async () => {
    writeBackup()
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })
    showMessageBox.mockResolvedValue({ response: 0 })

    const result = await importBackup()

    expect(result).toEqual({ success: false, reason: 'cancelled' })
    expect(closeDBWrapper).not.toHaveBeenCalled()
  })

  it('closes the DB and extracts the zip into userData on success', async () => {
    seedUserData({ photos: ['old.enc'] })
    writeBackup({ photos: ['new.enc'] })
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })
    showMessageBox.mockResolvedValue({ response: 1 })

    const result = await importBackup()

    expect(result).toEqual({ success: true })
    expect(closeDBWrapper).toHaveBeenCalledTimes(1)

    expect(readFileSync(join(userDataPath, DB_FILE_NAME), 'utf8')).toBe('imported-db-bytes')
    expect(readFileSync(join(userDataPath, SALT_FILE_NAME), 'utf8')).toBe('importedsalt')
    expect(existsSync(join(userDataPath, PHOTOS_DIR_NAME, 'new.enc'))).toBe(true)

    expect(existsSync(join(userDataPath, PHOTOS_DIR_NAME, 'old.enc'))).toBe(false)
  })

  it('proceeds when the manifest is unreadable JSON (treats as missing)', async () => {
    const zip = new AdmZip()
    zip.addFile(DB_FILE_NAME, Buffer.from('db'))
    zip.addFile(SALT_FILE_NAME, Buffer.from('salt'))
    zip.addFile('manifest.json', Buffer.from('not-json{{{'))
    zip.writeZip(backupOutPath)
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [backupOutPath] })
    showMessageBox.mockResolvedValue({ response: 1 })

    const result = await importBackup()

    expect(result).toEqual({ success: true })
  })
})
