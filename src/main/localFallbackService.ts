import words from '../../data/words.json'
import prompts from '../../data/prompts.json'
import log from 'electron-log'
import { WordOfDaySchema } from './db/schemas/wordOfDay'
import { WritingPromptSchema } from './db/schemas/writingPromptSchema'
import { ZodType } from 'zod'

// ======== Word of the Day fallback

// Validate once at module load. If the corpus is malformed, log it and fall
// back to an empty list — pickLocalWord will return null for every call rather
// than crashing the app.
// localFallbackService.ts
function createPicker<T>(
  corpus: unknown,
  schema: ZodType<T>,
  getKey: (item: T) => string,
  label: string
): (excluded: string[]) => T | null {
  const result = schema.array().safeParse(corpus)
  if (!result.success) {
    log.error(`${label} failed validation; fallback disabled`, { issues: result.error.issues })
  }
  const validated = result.success ? result.data : []

  return (excluded) => {
    const excludedSet = new Set(excluded.map((s) => s.toLowerCase()))
    const available = validated.filter((item) => !excludedSet.has(getKey(item).toLowerCase()))
    if (available.length === 0) return null
    return available[Math.floor(Math.random() * available.length)]
  }
}

export const pickLocalWord = createPicker(words, WordOfDaySchema, (i) => i.word, 'words.json')
export const pickLocalPrompt = createPicker(
  prompts,
  WritingPromptSchema,
  (i) => i.prompt,
  'prompts.json'
)
