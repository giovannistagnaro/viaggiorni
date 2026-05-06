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

import { pickLocalWord } from './localFallbackService'

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
    vi.spyOn(Math, 'random').mockReturnValue(0) // deterministic pick: index 0 of the filtered list

    const result = pickLocalWord(['ephemeral'])

    expect(result?.word).not.toBe('ephemeral')
  })

  it('treats exclusions as case-insensitive', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = pickLocalWord(['EPHEMERAL'])

    expect(result?.word).not.toBe('ephemeral')
  })

  it('treats exclusions as case-insensitive against the corpus', () => {
    // confirms the lowercase comparison happens on both sides
    const result = pickLocalWord(['Solace', 'Serendipity', 'Ephemeral'])

    expect(result).toBeNull()
  })

  it('returns null when every word is excluded', () => {
    const result = pickLocalWord(['ephemeral', 'serendipity', 'solace'])

    expect(result).toBeNull()
  })

  it('uses Math.random to pick from the available pool', () => {
    // first item of the filtered list
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(pickLocalWord([])?.word).toBe('ephemeral')

    // last item: Math.random() near 1 → floor((n-1).999...) = n-1
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    expect(pickLocalWord([])?.word).toBe('solace')
  })

  it('picks from only the non-excluded subset', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // first of filtered

    // exclude 'ephemeral' — pool becomes [serendipity, solace]
    expect(pickLocalWord(['ephemeral'])?.word).toBe('serendipity')
  })
})
