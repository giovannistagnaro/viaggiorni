import { eq, gte } from 'drizzle-orm'
import { DrizzleDB } from '../database'
import { wordOfDay } from '../schemas/schema'
import { WordOfDay } from '@shared/types'
import { addDays } from './helpers'

export function getWordForDate(db: DrizzleDB, date: string): WordOfDay | null {
  const word = db.select().from(wordOfDay).where(eq(wordOfDay.entryDate, date)).get()

  if (!word) return null
  return word
}

export function saveWord(
  db: DrizzleDB,
  date: string,
  word: string,
  definition: string,
  example: string,
  source: 'local' | 'ollama'
): void {
  db.insert(wordOfDay).values({ entryDate: date, word, definition, example, source }).run()
}

export function getUsedWords(db: DrizzleDB, date: string): string[] {
  const ninetyDaysAgo = addDays(date, -90)

  const words = db
    .select({ word: wordOfDay.word })
    .from(wordOfDay)
    .where(gte(wordOfDay.entryDate, ninetyDaysAgo))
    .all()

  return words.map((word) => word.word)
}
