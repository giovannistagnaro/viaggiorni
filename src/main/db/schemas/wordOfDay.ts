import { z } from 'zod'

export const WordOfDaySchema = z.object({
  word: z.string().min(1),
  definition: z.string().min(1),
  example: z.string().min(1)
})