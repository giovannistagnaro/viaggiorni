import words from '../../data/words.json'
import log from 'electron-log'
import { WordOfDayItem } from '@shared/types'
import { WordOfDaySchema } from './db/schemas/wordOfDay'

// Validate once at module load. If the corpus is malformed, log it and fall
// back to an empty list — pickLocalWord will return null for every call rather
// than crashing the app.
const parseResult = WordOfDaySchema.array().safeParse(words)
if (!parseResult.success) {
  log.error('words.json failed validation; local word fallback disabled', {
    issues: parseResult.error.issues
  })
}
const validatedWords: WordOfDayItem[] = parseResult.success ? parseResult.data : []

export function pickLocalWord(excludeWords: string[]): WordOfDayItem | null {
  const excluded = new Set(excludeWords.map((word) => word.toLowerCase()))

  const availableWords = validatedWords.filter((item) => !excluded.has(item.word.toLowerCase()))

  if (availableWords.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * availableWords.length)

  return availableWords[randomIndex]
}
