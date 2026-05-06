import { z } from 'zod'

export const WritingPromptSchema = z.object({
  prompt: z.string().min(1)
})
