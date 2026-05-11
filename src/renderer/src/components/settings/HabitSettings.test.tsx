import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HabitSettings from './HabitSettings'
import type { Habit, SafeReturnSettings } from '@shared/types'

const baseSettings = (overrides: Partial<SafeReturnSettings> = {}): SafeReturnSettings => ({
  id: 1,
  theme: 'light',
  streakTolerance: 1,
  ollamaModel: null,
  createdAt: '2026-05-01 00:00:00',
  updatedAt: null,
  ...overrides
})

const baseHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 1,
  name: 'Running',
  color: '#ff0000',
  isArchived: false,
  createdAt: '2020-01-01 00:00:00',
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
    },
    habit: {
      getActiveHabits: vi.fn().mockResolvedValue([]),
      createHabit: vi.fn().mockResolvedValue(undefined),
      archiveHabit: vi.fn().mockResolvedValue(undefined),
      unarchiveHabit: vi.fn(),
      updateHabit: vi.fn(),
      getHabitLogForDate: vi.fn(),
      toggleHabitCompleted: vi.fn(),
      pauseHabit: vi.fn(),
      resumeHabit: vi.fn(),
      calculateStreak: vi.fn()
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

  describe('habit management', () => {
    it('renders the list of active habits', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' }),
        baseHabit({ id: 2, name: 'Reading' })
      ])

      render(<HabitSettings />)

      expect(await screen.findByText('Running')).toBeInTheDocument()
      expect(await screen.findByText('Reading')).toBeInTheDocument()
    })

    it('shows a "no habits" message when the list is empty', async () => {
      render(<HabitSettings />)

      expect(await screen.findByText(/No habits yet/i)).toBeInTheDocument()
    })

    it('calls createHabit with the trimmed name and selected color on submit', async () => {
      render(<HabitSettings />)

      await screen.findByDisplayValue('1') // wait for mount
      await userEvent.type(screen.getByLabelText('Habit name'), '  Stretching  ')
      await userEvent.click(screen.getByRole('button', { name: 'Add habit' }))

      expect(window.api.habit.createHabit).toHaveBeenCalledWith('Stretching', '#6586db')
    })

    it('does not call createHabit when the name is empty', async () => {
      render(<HabitSettings />)

      await screen.findByDisplayValue('1')
      await userEvent.click(screen.getByRole('button', { name: 'Add habit' }))

      expect(window.api.habit.createHabit).not.toHaveBeenCalled()
    })

    it('refetches habits after adding', async () => {
      render(<HabitSettings />)

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalledTimes(1)
      })

      await userEvent.type(screen.getByLabelText('Habit name'), 'Stretching')
      await userEvent.click(screen.getByRole('button', { name: 'Add habit' }))

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalledTimes(2)
      })
    })

    it('archives a habit when the Archive button is clicked', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 7, name: 'Running' })
      ])

      render(<HabitSettings />)

      await userEvent.click(
        await screen.findByRole('button', { name: 'Archive Running' })
      )

      expect(window.api.habit.archiveHabit).toHaveBeenCalledWith(7)
    })

    it('refetches habits after archiving', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 7, name: 'Running' })
      ])

      render(<HabitSettings />)

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalledTimes(1)
      })

      await userEvent.click(
        await screen.findByRole('button', { name: 'Archive Running' })
      )

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalledTimes(2)
      })
    })
  })
})
