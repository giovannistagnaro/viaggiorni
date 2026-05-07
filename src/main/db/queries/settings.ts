// import { Settings } from '@shared/types'
// import { settings } from '../schemas/schema'
import { randomBytes } from 'crypto'
import { DrizzleDB } from '../database'
import { settings } from '../schemas/schema'
import { eq } from 'drizzle-orm'

// export function getSettings(db: DrizzleDB): void {
//   // TODO: implement
// }

export function getEncryptionKey(db: DrizzleDB): Buffer {
  const row = db.select().from(settings).get()

  if (!row) {
    throw new Error('Settings row missing — DB not properly seeded')
  }

  if (row.encryptionKey) return row.encryptionKey

  const generatedKey = randomBytes(32)
  db.update(settings).set({ encryptionKey: generatedKey }).where(eq(settings.id, row.id)).run()
  return generatedKey
}
