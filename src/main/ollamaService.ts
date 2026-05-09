import ollama, { ChatResponse, ListResponse } from 'ollama'
import { WordOfDaySchema } from './db/schemas/wordOfDay'
import { WordOfDayItem, WritingPromptItem } from '@shared/types'
import { WritingPromptSchema } from './db/schemas/writingPromptSchema'
import { ZodType } from 'zod'

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
const OLLAMA_WRITING_PROMPT_PROMPT = (recentPrompts: string[]): string => `
Generate a single writing prompt for a personal journal app.

Aim for something interesting and thought-provoking — favor specificity, unusual angles, and questions that reach for something slightly uncomfortable or revealing. Concrete over abstract: prefer "Write about a meal you remember more vividly than the people you ate it with" over "Reflect on your relationship with food." Mix categories across calls — memory, observation, hypothetical, sensory, identity, relational, place, time, regret, surprise, contradiction, humor.

Do not produce sappy, self-help, or gratitude-list-style prompts ("your inner light," "the love that surrounds you," yoga-studio whiteboard energy). Avoid generic prompts like "What are you grateful for today?" or "Describe your perfect day." Avoid explicitly therapeutic prompts, romance-specific prompts, and prompts that require specific life experiences (parenting, military, etc.). Nothing offensive.

Respond with a JSON object with exactly one field:
- prompt: string, 1–3 sentences, ending with a period, question mark, or exclamation point

Example:
{
  "prompt": "Describe a place you have been to that no longer exists. What detail of it do you remember most clearly, and why that one?"
}

Do not produce a prompt substantively similar to any of these recent prompts (avoid both literal duplicates and rephrasings of the same idea):
- ${recentPrompts.join('\n- ')}

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

async function generateFromOllama<T>(
  model: string,
  prompt: string,
  schema: ZodType<T>
): Promise<T | null> {
  let response: ChatResponse
  try {
    response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
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

  const result = schema.safeParse(raw)
  return result.success ? result.data : null
}

export const generateWordOfDay = (
  model: string,
  exclude: string[]
): Promise<WordOfDayItem | null> =>
  generateFromOllama(model, OLLAMA_WORD_OF_DAY_PROMPT(exclude), WordOfDaySchema)

export const generateWritingPrompt = (
  model: string,
  exclude: string[]
): Promise<WritingPromptItem | null> =>
  generateFromOllama(model, OLLAMA_WRITING_PROMPT_PROMPT(exclude), WritingPromptSchema)

export async function listOllamaModels(): Promise<string[] | null> {
  let response: ListResponse

  try {
    response = await ollama.list()
  } catch {
    return null
  }

  const models = response.models.map((model) => model.name)
  return models
}
