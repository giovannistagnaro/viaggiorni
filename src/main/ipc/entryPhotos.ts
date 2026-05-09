import { app, dialog, ipcMain } from 'electron'
import log from 'electron-log'
import {
  changePhotoPosition,
  createPhoto,
  deletePhoto,
  getPhotoById,
  getPhotosForEntry,
  updatePhotoCaption
} from '../db/queries/entryPhotos'
import { getDB } from '../db'
import { decryptFile, encryptFile } from '../photoEncryption'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { getEncryptionKey } from '../db/queries/settings'
import { unlink } from 'fs/promises'

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png'
}

export function registerEntryPhotosIpc(): void {
  ipcMain.handle('entryPhotos:createPhoto', async (_event, entryId: number) => {
    try {
      const filePath = dialog.showOpenDialogSync({
        title: 'Select a photo...',
        filters: [{ name: 'Images', extensions: ['jpg', 'png'] }],
        properties: ['openFile']
      })
      if (!filePath || filePath.length < 1) return null

      const sourcePath = filePath[0]
      const ext = extname(sourcePath).toLowerCase()
      const mimeType = EXT_TO_MIME[ext]
      if (!mimeType) throw new Error(`Unsupported image type: ${ext}`)
      const relativeEncryptedPath = join('photos', randomUUID() + '.enc')
      const fullEncryptedPath = join(app.getPath('userData'), relativeEncryptedPath)
      await encryptFile(sourcePath, fullEncryptedPath, getEncryptionKey(getDB()))

      return createPhoto(getDB(), entryId, relativeEncryptedPath, mimeType)
    } catch (err) {
      log.error('Failed to add photo', { entryId, error: err })
      throw err
      return
    }
  })

  ipcMain.handle('entryPhotos:getPhotosForEntry', (_event, entryId: number) => {
    try {
      return getPhotosForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to get photos for entry', { entryId, error: err })
      throw err
    }
  })

  ipcMain.handle('entryPhotos:getPhotoById', async (_event, photoId: number) => {
    try {
      const photo = getPhotoById(getDB(), photoId)
      if (!photo) return null

      const fullEncryptedPath = join(app.getPath('userData'), photo.filePath)
      const decryptedPhotoBuffer = await decryptFile(fullEncryptedPath, getEncryptionKey(getDB()))

      const dataUrl = `data:${photo.mimeType};base64,${decryptedPhotoBuffer.toString('base64')}`

      return { dataUrl, caption: photo.caption }
    } catch (err) {
      log.error('Failed to get photo', { photoId, error: err })
      throw err
    }
  })

  ipcMain.handle('entryPhotos:deletePhoto', async (_event, photoId: number) => {
    try {
      const filePath = deletePhoto(getDB(), photoId)
      if (!filePath) throw new Error('Photo not found')
      try {
        await unlink(join(app.getPath('userData'), filePath))
      } catch (unlinkErr) {
        log.warn('Failed to unlink photo file (orphan left on disk)', {
          photoId,
          error: unlinkErr
        })
      }
    } catch (err) {
      log.error('Failed to delete photo', { photoId, error: err })
      throw err
    }
  })

  ipcMain.handle(
    'entryPhotos:updatePhotoCaption',
    (_event, photoId: number, newCaption: string) => {
      try {
        updatePhotoCaption(getDB(), photoId, newCaption)
      } catch (err) {
        log.error('Failed to update photo caption', { photoId, error: err })
        throw err
      }
    }
  )

  ipcMain.handle(
    'entryPhotos:changePhotoPosition',
    (_event, photoId: number, newPosition: number) => {
      try {
        changePhotoPosition(getDB(), photoId, newPosition)
      } catch (err) {
        log.error('Failed to change photo position', { photoId, error: err })
        throw err
      }
    }
  )
}
