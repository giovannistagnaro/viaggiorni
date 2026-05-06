import { describe, it, expect } from 'vitest'
import { WritingPromptSchema } from './writingPromptSchema'

describe('WritingPromptSchema', () => {
  it('accepts a fully valid response', () => {
    const result = WritingPromptSchema.safeParse({
      prompt: 'Describe a place you have been to that no longer exists.'
    })

    expect(result.success).toBe(true)
  })

  it('rejects when the prompt field is missing', () => {
    const result = WritingPromptSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects when prompt is an empty string', () => {
    const result = WritingPromptSchema.safeParse({ prompt: '' })

    expect(result.success).toBe(false)
  })

  it('rejects when prompt is the wrong type', () => {
    const result = WritingPromptSchema.safeParse({ prompt: 42 })

    expect(result.success).toBe(false)
  })

  it('rejects when the input is null', () => {
    const result = WritingPromptSchema.safeParse(null)

    expect(result.success).toBe(false)
  })

  it('rejects when the input is not an object', () => {
    const result = WritingPromptSchema.safeParse('a writing prompt')

    expect(result.success).toBe(false)
  })

  it('strips unknown fields rather than rejecting (default Zod object behavior)', () => {
    const result = WritingPromptSchema.safeParse({
      prompt: 'A valid prompt.',
      category: 'memory'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('category')
    }
  })
})
