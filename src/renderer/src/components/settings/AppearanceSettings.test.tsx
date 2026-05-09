import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppearanceSettings from './AppearanceSettings'
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
      updateTheme: vi.fn().mockResolvedValue(undefined),
      updateStreakTolerance: vi.fn(),
      updateOllamaModel: vi.fn()
    }
  } as never
})

describe('AppearanceSettings', () => {
  it('fetches settings on mount', async () => {
    render(<AppearanceSettings />)

    await waitFor(() => {
      expect(window.api.settings.getSettings).toHaveBeenCalled()
    })
  })

  it('selects the current theme from settings', async () => {
    vi.mocked(window.api.settings.getSettings).mockResolvedValue(baseSettings({ theme: 'dark' }))

    render(<AppearanceSettings />)

    const select = (await screen.findByRole('combobox')) as HTMLSelectElement
    expect(select.value).toBe('dark')
  })

  it('calls updateTheme when a different theme is selected', async () => {
    render(<AppearanceSettings />)

    const select = await screen.findByRole('combobox')
    await userEvent.selectOptions(select, 'dark')

    expect(window.api.settings.updateTheme).toHaveBeenCalledWith('dark')
  })
})
