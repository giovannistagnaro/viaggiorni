import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ollama from 'ollama'
import {
  isOllamaAvailable,
  generateWordOfDay,
  generateWritingPrompt,
  listOllamaModels
} from './ollamaService'

vi.mock('ollama', () => ({
  default: { chat: vi.fn(), list: vi.fn() }
}))

const mockedChat = vi.mocked(ollama.chat)
const mockedList = vi.mocked(ollama.list)

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

describe('generateWritingPrompt', () => {
  const validJson = JSON.stringify({
    prompt: 'Describe a place you have been to that no longer exists.'
  })

  function mockChatContent(content: string): void {
    mockedChat.mockResolvedValue({
      message: { role: 'assistant', content }
    } as never)
  }

  it('returns the parsed prompt entry when ollama returns valid JSON', async () => {
    mockChatContent(validJson)

    const result = await generateWritingPrompt('llama3', [])

    expect(result).toEqual({
      prompt: 'Describe a place you have been to that no longer exists.'
    })
  })

  it('returns null when the response is missing the prompt field', async () => {
    mockChatContent(JSON.stringify({}))

    expect(await generateWritingPrompt('llama3', [])).toBeNull()
  })

  it('returns null when prompt is the wrong type', async () => {
    mockChatContent(JSON.stringify({ prompt: 42 }))

    expect(await generateWritingPrompt('llama3', [])).toBeNull()
  })

  it('returns null when prompt is empty', async () => {
    mockChatContent(JSON.stringify({ prompt: '' }))

    expect(await generateWritingPrompt('llama3', [])).toBeNull()
  })

  it('passes the given model to ollama.chat', async () => {
    mockChatContent(validJson)

    await generateWritingPrompt('mistral:latest', [])

    expect(mockedChat).toHaveBeenCalledWith(expect.objectContaining({ model: 'mistral:latest' }))
  })

  it('includes excluded prompts in the prompt content', async () => {
    mockChatContent(validJson)

    await generateWritingPrompt('llama3', ['exclude one', 'exclude two'])

    const args = mockedChat.mock.calls[0][0]
    const promptContent = (args as { messages: Array<{ content: string }> }).messages[0].content
    expect(promptContent).toContain('exclude one')
    expect(promptContent).toContain('exclude two')
  })
})

describe('listOllamaModels', () => {
  it('returns the list of model names when ollama.list resolves', async () => {
    mockedList.mockResolvedValue({
      models: [
        { name: 'llama3:latest' },
        { name: 'mistral:latest' },
        { name: 'phi3:medium' }
      ]
    } as never)

    const result = await listOllamaModels()

    expect(result).toEqual(['llama3:latest', 'mistral:latest', 'phi3:medium'])
  })

  it('returns an empty array when no models are installed', async () => {
    mockedList.mockResolvedValue({ models: [] } as never)

    expect(await listOllamaModels()).toEqual([])
  })

  it('returns null when ollama.list throws (e.g. ollama not running)', async () => {
    mockedList.mockRejectedValue(new Error('connection refused'))

    expect(await listOllamaModels()).toBeNull()
  })
})
