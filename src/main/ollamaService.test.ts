import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ollama from 'ollama'
import { isOllamaAvailable, generateWordOfDay } from './ollamaService'

vi.mock('ollama', () => ({
  default: { chat: vi.fn() }
}))

const mockedChat = vi.mocked(ollama.chat)

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('isOllamaAvailable', () => {
  it('returns true when fetch returns an ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    expect(await isOllamaAvailable()).toBe(true)
  })

  it('returns false when fetch returns a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    expect(await isOllamaAvailable()).toBe(false)
  })

  it('returns false when fetch throws (e.g. ollama not running)', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('connection refused'))

    expect(await isOllamaAvailable()).toBe(false)
  })

  it('returns false when the request times out', async () => {
    vi.useFakeTimers()

    // fetch hangs but rejects when its AbortSignal is aborted
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
        })
    )

    const result = isOllamaAvailable()
    await vi.advanceTimersByTimeAsync(2001)

    expect(await result).toBe(false)

    vi.useRealTimers()
  })
})

describe('generateWordOfDay', () => {
  const validJson = JSON.stringify({
    word: 'ephemeral',
    definition: 'Lasting a very short time.',
    example: 'A fleeting smile.'
  })

  function mockChatContent(content: string): void {
    mockedChat.mockResolvedValue({
      message: { role: 'assistant', content }
    } as never)
  }

  it('returns the parsed word entry when ollama returns valid JSON', async () => {
    mockChatContent(validJson)

    const result = await generateWordOfDay('llama3', [])

    expect(result).toEqual({
      word: 'ephemeral',
      definition: 'Lasting a very short time.',
      example: 'A fleeting smile.'
    })
  })

  it('returns null when ollama.chat throws', async () => {
    mockedChat.mockRejectedValue(new Error('connection refused'))

    expect(await generateWordOfDay('llama3', [])).toBeNull()
  })

  it('returns null when the response content is not valid JSON', async () => {
    mockChatContent('not json at all')

    expect(await generateWordOfDay('llama3', [])).toBeNull()
  })

  it('returns null when the response is missing a required field', async () => {
    mockChatContent(JSON.stringify({ word: 'ephemeral', definition: 'Short-lived.' }))

    expect(await generateWordOfDay('llama3', [])).toBeNull()
  })

  it('returns null when a field has the wrong type', async () => {
    mockChatContent(
      JSON.stringify({ word: 42, definition: 'Short-lived.', example: 'A fleeting smile.' })
    )

    expect(await generateWordOfDay('llama3', [])).toBeNull()
  })

  it('returns null when a required field is empty', async () => {
    mockChatContent(JSON.stringify({ word: '', definition: 'Short-lived.', example: 'Example.' }))

    expect(await generateWordOfDay('llama3', [])).toBeNull()
  })

  it('passes the given model to ollama.chat', async () => {
    mockChatContent(validJson)

    await generateWordOfDay('mistral:latest', [])

    expect(mockedChat).toHaveBeenCalledWith(expect.objectContaining({ model: 'mistral:latest' }))
  })

  it("requests JSON-formatted output via format: 'json'", async () => {
    mockChatContent(validJson)

    await generateWordOfDay('llama3', [])

    expect(mockedChat).toHaveBeenCalledWith(expect.objectContaining({ format: 'json' }))
  })

  it('includes excluded words in the prompt', async () => {
    mockChatContent(validJson)

    await generateWordOfDay('llama3', ['serendipity', 'ephemeral'])

    const args = mockedChat.mock.calls[0][0]
    const promptContent = (args as { messages: Array<{ content: string }> }).messages[0].content
    expect(promptContent).toContain('serendipity')
    expect(promptContent).toContain('ephemeral')
  })
})
