import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HabitSettings from './HabitSettings'
import type { SafeReturnSettings } from '@shared/types'

const baseSettings = (overrides: Partial<SafeReturnSettings> = {}): SafeReturnSettings => ({
  id: 1,
  theme: 'light',
  streakTolerance: 1,
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
      updateStreakTolerance: vi.fn().mockResolvedValue(undefined),
      updateOllamaModel: vi.fn()
    }
  } as never
})

describe('HabitSettings', () => {
  it('fetches settings on mount', async () => {
    render(<HabitSettings />)

    await waitFor(() => {
      expect(window.api.settings.getSettings).toHaveBeenCalled()
    })
  })

  it('renders the streak tolerance from settings', async () => {
    vi.mocked(window.api.settings.getSettings).mockResolvedValue(
      baseSettings({ streakTolerance: 3 })
    )

    render(<HabitSettings />)

    expect(await screen.findByDisplayValue('3')).toBeInTheDocument()
  })

  it('calls updateStreakTolerance on blur with the new value', async () => {
    render(<HabitSettings />)

    const input = await screen.findByDisplayValue('1')
    await userEvent.tripleClick(input)
    await userEvent.keyboard('5')
    await userEvent.tab()

    expect(window.api.settings.updateStreakTolerance).toHaveBeenCalledWith(5)
  })
})
