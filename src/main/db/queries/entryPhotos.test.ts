import { DrizzleDB } from '../database'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
import { entryPhotos } from '../schemas/schema'
import { eq } from 'drizzle-orm'
import {
  changePhotoPosition,
  createPhoto,
  deletePhoto,
  getPhotoById,
  getPhotosForEntry,
  updatePhotoCaption
} from './entryPhotos'
import { createEntry } from './entries'

const MIME = 'image/jpeg'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('createPhoto', () => {
  it('returns the created photo with the given filePath, mimeType, and caption', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const photo = createPhoto(db, entry.id, 'photos/abc.enc', MIME, 'A caption')

    expect(photo.entryId).toBe(entry.id)
    expect(photo.filePath).toBe('photos/abc.enc')
    expect(photo.mimeType).toBe(MIME)
    expect(photo.caption).toBe('A caption')
  })

  it('auto-positions the first photo at 0', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const photo = createPhoto(db, entry.id, 'photos/a.enc', MIME)

    expect(photo.position).toBe(0)
  })

  it('auto-positions subsequent photos at the end', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    createPhoto(db, entry.id, 'photos/a.enc', MIME)
    createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const third = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    expect(third.position).toBe(2)
  })

  it('positions independently per entry', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createPhoto(db, entry1.id, 'photos/a.enc', MIME)
    createPhoto(db, entry1.id, 'photos/b.enc', MIME)
    const firstOnEntry2 = createPhoto(db, entry2.id, 'photos/c.enc', MIME)

    expect(firstOnEntry2.position).toBe(0)
  })
})

describe('getPhotoById', () => {
  it('returns the photo with the matching id', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const photo = createPhoto(db, entry.id, 'photos/abc.enc', MIME)

    expect(getPhotoById(db, photo.id)?.id).toBe(photo.id)
  })

  it('returns null when no photo matches the id', () => {
    expect(getPhotoById(db, 999)).toBeNull()
  })

  it('returns the row with mimeType populated', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const photo = createPhoto(db, entry.id, 'photos/abc.enc', 'image/png')

    expect(getPhotoById(db, photo.id)?.mimeType).toBe('image/png')
  })
})

describe('getPhotosForEntry', () => {
  it('returns an empty array when no photos exist', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    expect(getPhotosForEntry(db, entry.id)).toEqual([])
  })

  it('returns only photos for the specified entry', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createPhoto(db, entry1.id, 'photos/a.enc', MIME)
    createPhoto(db, entry2.id, 'photos/b.enc', MIME)

    const result = getPhotosForEntry(db, entry1.id)
    expect(result.length).toBe(1)
    expect(result[0].filePath).toBe('photos/a.enc')
  })

  it('orders photos by position ascending', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    createPhoto(db, entry.id, 'photos/a.enc', MIME)
    createPhoto(db, entry.id, 'photos/b.enc', MIME)
    createPhoto(db, entry.id, 'photos/c.enc', MIME)

    const result = getPhotosForEntry(db, entry.id)
    expect(result.map((p) => p.position)).toEqual([0, 1, 2])
  })
})

describe('deletePhoto', () => {
  it("returns the deleted row's filePath", () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const photo = createPhoto(db, entry.id, 'photos/abc.enc', MIME)

    expect(deletePhoto(db, photo.id)).toBe('photos/abc.enc')
  })

  it('returns null when the photo does not exist', () => {
    expect(deletePhoto(db, 999)).toBeNull()
  })

  it('removes the photo from the database', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const photo = createPhoto(db, entry.id, 'photos/abc.enc', MIME)

    deletePhoto(db, photo.id)

    expect(getPhotosForEntry(db, entry.id)).toEqual([])
  })

  it('shifts the positions of photos after the deleted one down by 1', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const a = createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const c = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    deletePhoto(db, a.id)

    const remaining = getPhotosForEntry(db, entry.id)
    expect(remaining.map((p) => ({ id: p.id, position: p.position }))).toEqual([
      { id: b.id, position: 0 },
      { id: c.id, position: 1 }
    ])
  })

  it('does not shift photos from other entries', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    const photo1 = createPhoto(db, entry1.id, 'photos/a.enc', MIME)
    const photo2 = createPhoto(db, entry2.id, 'photos/b.enc', MIME)

    deletePhoto(db, photo1.id)

    const entry2Photos = getPhotosForEntry(db, entry2.id)
    expect(entry2Photos[0].id).toBe(photo2.id)
    expect(entry2Photos[0].position).toBe(0)
  })
})

describe('updatePhotoCaption', () => {
  it('updates the caption of the specified photo', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const photo = createPhoto(db, entry.id, 'photos/abc.enc', MIME, 'Old caption')

    updatePhotoCaption(db, photo.id, 'New caption')

    const updated = db.select().from(entryPhotos).where(eq(entryPhotos.id, photo.id)).get()
    expect(updated?.caption).toBe('New caption')
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const photo = createPhoto(db, entry.id, 'photos/abc.enc', MIME)

    updatePhotoCaption(db, photo.id, 'Caption')

    const updated = db.select().from(entryPhotos).where(eq(entryPhotos.id, photo.id)).get()
    expect(updated?.updatedAt).not.toBeNull()
  })
})

describe('changePhotoPosition', () => {
  it('moves a photo to a higher position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const a = createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const c = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    changePhotoPosition(db, a.id, 2)

    const result = getPhotosForEntry(db, entry.id)
    expect(result.map((p) => p.id)).toEqual([b.id, c.id, a.id])
  })

  it('moves a photo to a lower position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const a = createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const c = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    changePhotoPosition(db, c.id, 0)

    const result = getPhotosForEntry(db, entry.id)
    expect(result.map((p) => p.id)).toEqual([c.id, a.id, b.id])
  })

  it('does nothing when newPosition equals current position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const a = createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const c = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    changePhotoPosition(db, b.id, 1)

    const result = getPhotosForEntry(db, entry.id)
    expect(result.map((p) => p.id)).toEqual([a.id, b.id, c.id])
  })

  it('clamps newPosition higher than max to the end', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const a = createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const c = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    changePhotoPosition(db, a.id, 999)

    const result = getPhotosForEntry(db, entry.id)
    expect(result.map((p) => p.id)).toEqual([b.id, c.id, a.id])
  })

  it('clamps negative newPosition to the start', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const a = createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    const c = createPhoto(db, entry.id, 'photos/c.enc', MIME)

    changePhotoPosition(db, c.id, -5)

    const result = getPhotosForEntry(db, entry.id)
    expect(result.map((p) => p.id)).toEqual([c.id, a.id, b.id])
  })

  it('preserves the total count of photos', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    createPhoto(db, entry.id, 'photos/a.enc', MIME)
    const b = createPhoto(db, entry.id, 'photos/b.enc', MIME)
    createPhoto(db, entry.id, 'photos/c.enc', MIME)

    changePhotoPosition(db, b.id, 0)

    expect(getPhotosForEntry(db, entry.id).length).toBe(3)
  })

  it('throws when the photo does not exist', () => {
    expect(() => changePhotoPosition(db, 999, 0)).toThrow(/Photo not found/)
  })
})
