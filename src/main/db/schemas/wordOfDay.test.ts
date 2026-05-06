import { describe, it, expect } from 'vitest'
import { WordOfDaySchema } from './wordOfDay'

describe('WordOfDaySchema', () => {
  it('accepts a fully valid response', () => {
    const result = WordOfDaySchema.safeParse({
      word: 'ephemeral',
      definition: 'Lasting a very short time.',
      example: 'A fleeting smile.'
    })

    expect(result.success).toBe(true)
  })

  it('rejects when the word field is missing', () => {
    const result = WordOfDaySchema.safeParse({
      definition: 'Lasting a very short time.',
      example: 'A fleeting smile.'
    })

    expect(result.success).toBe(false)
  })

  it('rejects when the definition field is missing', () => {
    const result = WordOfDaySchema.safeParse({
      word: 'ephemeral',
      example: 'A fleeting smile.'
    })

    expect(result.success).toBe(false)
  })

  it('rejects when the example field is missing', () => {
    const result = WordOfDaySchema.safeParse({
      word: 'ephemeral',
      definition: 'Lasting a very short time.'
    })

    expect(result.success).toBe(false)
  })

  it('rejects when word is an empty string', () => {
    const result = WordOfDaySchema.safeParse({
      word: '',
      definition: 'Lasting a very short time.',
      example: 'A fleeting smile.'
    })

    expect(result.success).toBe(false)
  })

  it('rejects when definition is an empty string', () => {
    const result = WordOfDaySchema.safeParse({
      word: 'ephemeral',
      definition: '',
      example: 'A fleeting smile.'
    })

    expect(result.success).toBe(false)
  })

  it('rejects when example is an empty string', () => {
    const result = WordOfDaySchema.safeParse({
      word: 'ephemeral',
      definition: 'Lasting a very short time.',
      example: ''
    })

    expect(result.success).toBe(false)
  })

  it('rejects when a field is the wrong type', () => {
    const result = WordOfDaySchema.safeParse({
      word: 42,
      definition: 'Lasting a very short time.',
      example: 'A fleeting smile.'
    })

    expect(result.success).toBe(false)
  })

  it('rejects when the input is null', () => {
    const result = WordOfDaySchema.safeParse(null)

    expect(result.success).toBe(false)
  })

  it('rejects when the input is not an object', () => {
    const result = WordOfDaySchema.safeParse('ephemeral')

    expect(result.success).toBe(false)
  })

  it('strips unknown fields rather than rejecting (default Zod object behavior)', () => {
    const result = WordOfDaySchema.safeParse({
      word: 'ephemeral',
      definition: 'Lasting a very short time.',
      example: 'A fleeting smile.',
      partOfSpeech: 'adjective'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('partOfSpeech')
    }
  })
})
