import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../data/words.json', () => ({
  default: [
    { word: 'ephemeral', definition: 'Lasting a very short time.', example: 'A fleeting smile.' },
    {
      word: 'serendipity',
      definition: 'A pleasant surprise.',
      example: 'A serendipitous meeting.'
    },
    { word: 'solace', definition: 'Comfort in distress.', example: 'She found solace in walks.' }
  ]
}))

vi.mock('../../data/prompts.json', () => ({
  default: [{ prompt: 'First prompt.' }, { prompt: 'Second prompt.' }, { prompt: 'Third prompt.' }]
}))

import { pickLocalWord, pickLocalPrompt } from './localFallbackService'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pickLocalWord', () => {
  it('returns an entry from the corpus when no words are excluded', () => {
    const result = pickLocalWord([])

    expect(result).not.toBeNull()
    expect(['ephemeral', 'serendipity', 'solace']).toContain(result?.word)
  })

  it('returns an entry with all three required fields', () => {
    const result = pickLocalWord([])

    expect(result).toEqual(
      expect.objectContaining({
        word: expect.any(String),
        definition: expect.any(String),
        example: expect.any(String)
      })
    )
  })

  it('does not pick an excluded word', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = pickLocalWord(['ephemeral'])

    expect(result?.word).not.toBe('ephemeral')
  })

  it('treats exclusions as case-insensitive', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = pickLocalWord(['EPHEMERAL'])

    expect(result?.word).not.toBe('ephemeral')
  })

  it('treats exclusions as case-insensitive against the corpus', () => {
    const result = pickLocalWord(['Solace', 'Serendipity', 'Ephemeral'])

    expect(result).toBeNull()
  })

  it('returns null when every word is excluded', () => {
    const result = pickLocalWord(['ephemeral', 'serendipity', 'solace'])

    expect(result).toBeNull()
  })

  it('uses Math.random to pick from the available pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(pickLocalWord([])?.word).toBe('ephemeral')

    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    expect(pickLocalWord([])?.word).toBe('solace')
  })

  it('picks from only the non-excluded subset', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(pickLocalWord(['ephemeral'])?.word).toBe('serendipity')
  })
})

describe('pickLocalPrompt', () => {
  it('returns an entry from the corpus when no prompts are excluded', () => {
    const result = pickLocalPrompt([])

    expect(result).not.toBeNull()
    expect(['First prompt.', 'Second prompt.', 'Third prompt.']).toContain(result?.prompt)
  })

  it('returns an entry with the prompt field', () => {
    const result = pickLocalPrompt([])

    expect(result).toEqual(expect.objectContaining({ prompt: expect.any(String) }))
  })

  it('does not pick an excluded prompt', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = pickLocalPrompt(['First prompt.'])

    expect(result?.prompt).not.toBe('First prompt.')
  })

  it('treats exclusions as case-insensitive', () => {
    const result = pickLocalPrompt(['FIRST PROMPT.', 'SECOND PROMPT.', 'THIRD PROMPT.'])

    expect(result).toBeNull()
  })

  it('returns null when every prompt is excluded', () => {
    const result = pickLocalPrompt(['First prompt.', 'Second prompt.', 'Third prompt.'])

    expect(result).toBeNull()
  })

  it('picks from only the non-excluded subset', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(pickLocalPrompt(['First prompt.'])?.prompt).toBe('Second prompt.')
  })
})
