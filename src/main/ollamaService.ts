import ollama, { ChatResponse } from 'ollama'
import { WordOfDaySchema } from './db/schemas/wordOfDay'
import { WordOfDayItem } from '@shared/types'

const OLLAMA_WORD_OF_DAY_PROMPT = (bannedWords: string[]): string => `
Generate a single "word of the day" for a personal journal app.

Aim for something interesting — favor evocative, vivid, or thought-provoking words over plain everyday vocabulary. Occasionally (roughly one in seven times) you may choose a foreign word that has no direct one-to-one English equivalent (for example: "saudade", "hygge", "wabi-sabi", "schadenfreude") — when you do, the definition should explain the concept clearly in English.

Do not pick anything profane, vulgar, slurs, or otherwise offensive. Avoid technical jargon and overly obscure archaic terms.

Respond with a JSON object with exactly these three fields:
- word: string, lowercase, single token (foreign words allowed)
- definition: string, one concise sentence under 25 words, plain English
- example: string, one natural sentence using the word in context, under 25 words

Example:
{
  "word": "ephemeral",
  "definition": "Lasting for a very short time.",
  "example": "The ephemeral beauty of cherry blossoms draws crowds every spring."
}

Do not pick any word from this list (case-insensitive): ${bannedWords.join(', ')}

Respond only with the JSON object — no surrounding prose, no markdown fences.
`

export async function isOllamaAvailable(): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: controller.signal
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateWordOfDay(
  model: string,
  excludeWords: string[]
): Promise<WordOfDayItem | null> {
  let response: ChatResponse
  try {
    response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: OLLAMA_WORD_OF_DAY_PROMPT(excludeWords) }],
      format: 'json'
    })
  } catch {
    return null
  }

  let raw: unknown
  try {
    raw = JSON.parse(response.message.content)
  } catch {
    return null
  }

  const result = WordOfDaySchema.safeParse(raw)
  return result.success ? result.data : null
}
