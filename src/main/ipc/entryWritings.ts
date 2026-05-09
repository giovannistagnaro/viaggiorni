import { ipcMain } from 'electron'
import {
  getUsedWritingPrompts,
  getWritingById,
  getWritingsForEntry,
  updateWritingContent,
  updateWritingPrompt
} from '../db/queries/entryWritings'
import { getDB } from '../db'
import log from 'electron-log'
import { generateWritingPrompt, isOllamaAvailable } from '../ollamaService'
import { pickLocalPrompt } from '../localFallbackService'
import { getSettings } from '../db/queries/settings'

export function registerEntryWritingsIpc(): void {
  ipcMain.handle('entryWritings:getWritingsForEntry', (_event, entryId: number) => {
    try {
      return getWritingsForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to find matching entry for writings', { entryId, error: err })
      throw err
    }
  })
  ipcMain.handle(
    'entryWritings:updateWritingContent',
    (_event, writingId: number, newContent: string) => {
      try {
        updateWritingContent(getDB(), writingId, newContent)
      } catch (err) {
        log.error('Failed to update writing content', { writingId, error: err })
        throw err
      }
    }
  )
  ipcMain.handle(
    'entryWritings:updateWritingPrompt',
    (_event, writingId: number, newPrompt: string) => {
      try {
        updateWritingPrompt(getDB(), writingId, newPrompt)
      } catch (err) {
        log.error('Failed to update writing prompt', { writingId, error: err })
        throw err
      }
    }
  )
  ipcMain.handle(
    'entryWritings:getOrCreatePromptForWriting',
    async (_event, writingId: number, entryDate: string) => {
      try {
        const db = getDB()
        const writing = getWritingById(db, writingId)
        if (writing?.prompt) return writing.prompt

        const excludePrompts = getUsedWritingPrompts(db, entryDate)

        const settings = getSettings(db)
        const ollamaModel: string | null = settings.ollamaModel

        if (ollamaModel && (await isOllamaAvailable())) {
          for (let i = 0; i < 2; i++) {
            const result = await generateWritingPrompt(ollamaModel, excludePrompts)
            if (result && !excludePrompts.includes(result.prompt.toLowerCase())) {
              updateWritingPrompt(db, writingId, result.prompt)
              return result.prompt
            }
          }
        }

        const local = pickLocalPrompt(excludePrompts)
        if (!local) return null
        updateWritingPrompt(db, writingId, local.prompt)
        return local.prompt
      } catch (err) {
        log.error('Failed to get or create writing prompt', { writingId, error: err })
        throw err
      }
    }
  )
}
