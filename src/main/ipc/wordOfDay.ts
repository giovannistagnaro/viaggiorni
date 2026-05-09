import { ipcMain } from 'electron'
import { generateWordOfDay, isOllamaAvailable } from '../ollamaService'
import { getUsedWords, getWordForDate, saveWord } from '../db/queries/wordOfDay'
import { getDB } from '../db'
import { pickLocalWord } from '../localFallbackService'
// import { settings } from '../db/schemas/schema'
// import { getSettings } from '../db/queries/settings'
import log from 'electron-log'
import { WordOfDay } from '@shared/types'
import { getSettings } from '../db/queries/settings'

export function registerWordOfDayIpc(): void {
  ipcMain.handle(
    'wordOfDay:getOrCreateForDate',
    async (_event, date: string): Promise<WordOfDay | null> => {
      try {
        const db = getDB()

        // just return the current word if it exists
        const existing = getWordForDate(db, date)
        if (existing) return existing

        const excludeWords = getUsedWords(db, date)

        const settings = getSettings(db)
        const ollamaModel: string | null = settings.ollamaModel

        if (ollamaModel && (await isOllamaAvailable())) {
          for (let i = 0; i < 2; i++) {
            const result = await generateWordOfDay(ollamaModel, excludeWords)
            if (result && !excludeWords.includes(result.word.toLowerCase())) {
              saveWord(db, date, result.word, result.definition, result.example, 'ollama')
              return getWordForDate(db, date)
            }
          }
        }

        const local = pickLocalWord(excludeWords)
        if (!local) return null
        saveWord(db, date, local.word, local.definition, local.example, 'local')
        return getWordForDate(db, date)
      } catch (err) {
        log.error('Failed to get or create word of day', { date, error: err })
        throw err
      }
    }
  )
}
