import { and, asc, eq, gt, gte, lt, lte, max, sql } from 'drizzle-orm'
import { DrizzleDB } from '../database'
import { entryPhotos } from '../schemas/schema'
import { EntryPhoto } from '@shared/types'

export function getPhotosForEntry(db: DrizzleDB, entryId: number): EntryPhoto[] {
  return db
    .select()
    .from(entryPhotos)
    .where(eq(entryPhotos.entryId, entryId))
    .orderBy(asc(entryPhotos.position))
    .all()
}

export function createPhoto(
  db: DrizzleDB,
  entryId: number,
  filePath: string,
  caption?: string
): EntryPhoto {
  const lastPosition = db
    .select({ max: sql<number>`COALESCE(MAX(${entryPhotos.position}), -1)` })
    .from(entryPhotos)
    .where(eq(entryPhotos.entryId, entryId))
    .get()
  const position = (lastPosition?.max ?? -1) + 1

  return db.insert(entryPhotos).values({ entryId, filePath, caption, position }).returning().get()
}

export function deletePhoto(db: DrizzleDB, photoId: number): string | null {
  return db.transaction((tx) => {
    const row = tx
      .select({
        filePath: entryPhotos.filePath,
        position: entryPhotos.position,
        entryId: entryPhotos.entryId
      })
      .from(entryPhotos)
      .where(eq(entryPhotos.id, photoId))
      .get()

    if (!row) return null

    tx.delete(entryPhotos).where(eq(entryPhotos.id, photoId)).run()

    tx.update(entryPhotos)
      .set({ position: sql`${entryPhotos.position} - 1` })
      .where(and(eq(entryPhotos.entryId, row.entryId), gt(entryPhotos.position, row.position)))
      .run()

    return row.filePath
  })
}

export function updatePhotoCaption(db: DrizzleDB, photoId: number, caption: string): void {
  db.update(entryPhotos)
    .set({ caption, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(entryPhotos.id, photoId))
    .run()
}

export function changePhotoPosition(db: DrizzleDB, photoId: number, newPosition: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: entryPhotos.position })
      .from(entryPhotos)
      .where(eq(entryPhotos.id, photoId))
      .get()

    if (!row) throw new Error(`Photo not found`)

    const maxRow = tx
      .select({ maxPosition: max(entryPhotos.position) })
      .from(entryPhotos)
      .get()

    const maxPosition = maxRow?.maxPosition ?? 1

    newPosition = Math.max(0, Math.min(newPosition, maxPosition))

    const oldPosition = row.position

    if (newPosition > oldPosition) {
      tx.update(entryPhotos)
        .set({ position: sql`${entryPhotos.position} - 1`, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(gt(entryPhotos.position, oldPosition), lte(entryPhotos.position, newPosition)))
        .run()
    } else if (newPosition < oldPosition) {
      tx.update(entryPhotos)
        .set({ position: sql`${entryPhotos.position} + 1`, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(lt(entryPhotos.position, oldPosition), gte(entryPhotos.position, newPosition)))
        .run()
    } else {
      return
    }
    tx.update(entryPhotos)
      .set({ position: newPosition, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(entryPhotos.id, photoId))
      .run()
  })
}
