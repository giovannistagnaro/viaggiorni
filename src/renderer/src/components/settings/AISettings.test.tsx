import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AISettings from './AISettings'
import type { SafeReturnSettings } from '@shared/types'

const baseSettings = (overrides: Partial<SafeReturnSettings> = {}): SafeReturnSettings => ({
  id: 1,
  theme: 'light',
  streakTolerance: 0,
  ollamaModel: null,
  createdAt: '2026-05-01 00:00:00',
  updatedAt: null,
  ...overrides
})

beforeEach(() => {
  window.api = {
    settings: {
      getSettings: vi.fn().mockResolvedValue(baseSettings()),
      updateTheme: vi.fn(),
      updateStreakTolerance: vi.fn(),
      updateOllamaModel: vi.fn().mockResolvedValue(undefined)
    },
    ollama: {
      isOllamaAvailable: vi.fn().mockResolvedValue(false),
      listOllamaModels: vi.fn().mockResolvedValue(null)
    }
  } as never
})

describe('AISettings', () => {
  it('fetches settings, availability, and models on mount', async () => {
    render(<AISettings />)

    await waitFor(() => {
      expect(window.api.settings.getSettings).toHaveBeenCalled()
      expect(window.api.ollama.isOllamaAvailable).toHaveBeenCalled()
      expect(window.api.ollama.listOllamaModels).toHaveBeenCalled()
    })
  })

  describe('when Ollama is unavailable', () => {
    it('shows the unavailable status', async () => {
      vi.mocked(window.api.ollama.isOllamaAvailable).mockResolvedValue(false)

      render(<AISettings />)

      expect(await screen.findByText(/Not available/i)).toBeInTheDocument()
    })

    it('does not render the model select', async () => {
      vi.mocked(window.api.ollama.isOllamaAvailable).mockResolvedValue(false)

      render(<AISettings />)

      await screen.findByText(/Not available/i)
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
  })

  describe('when Ollama is available', () => {
    beforeEach(() => {
      vi.mocked(window.api.ollama.isOllamaAvailable).mockResolvedValue(true)
      vi.mocked(window.api.ollama.listOllamaModels).mockResolvedValue([
        'llama3:latest',
        'mistral:latest'
      ])
    })

    it('shows the available status', async () => {
      render(<AISettings />)

      expect(await screen.findByText(/^Available$/i)).toBeInTheDocument()
    })

    it('renders the model select with the fetched options', async () => {
      render(<AISettings />)

      await screen.findByRole('combobox')
      expect(screen.getByRole('option', { name: 'llama3:latest' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'mistral:latest' })).toBeInTheDocument()
    })

    it('calls updateOllamaModel when a model is selected', async () => {
      vi.mocked(window.api.settings.getSettings).mockResolvedValue(
        baseSettings({ ollamaModel: 'llama3:latest' })
      )

      render(<AISettings />)

      const select = await screen.findByRole('combobox')
      await userEvent.selectOptions(select, 'mistral:latest')

      expect(window.api.settings.updateOllamaModel).toHaveBeenCalledWith('mistral:latest')
    })
  })

  it('refreshes availability and models when Refresh is clicked', async () => {
    render(<AISettings />)

    await screen.findByRole('button', { name: /Refresh/i })
    vi.mocked(window.api.ollama.isOllamaAvailable).mockClear()
    vi.mocked(window.api.ollama.listOllamaModels).mockClear()

    await userEvent.click(screen.getByRole('button', { name: /Refresh/i }))

    expect(window.api.ollama.isOllamaAvailable).toHaveBeenCalled()
    expect(window.api.ollama.listOllamaModels).toHaveBeenCalled()
  })
})
