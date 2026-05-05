import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HabitTrackerWidget from './HabitTrackerWidget'
import type { Habit, HabitLog } from '@shared/types'

const ENTRY_DATE = '2026-05-04'

const baseHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 1,
  name: 'Running',
  color: '#ff0000',
  isArchived: false,
  createdAt: '2020-01-01 00:00:00',
  updatedAt: null,
  ...overrides
})

const baseLog = (overrides: Partial<HabitLog> = {}): HabitLog => ({
  id: 1,
  habitId: 1,
  entryDate: ENTRY_DATE,
  completed: false,
  createdAt: '2026-05-04 00:00:00',
  ...overrides
})

beforeEach(() => {
  window.api = {
    db: { open: vi.fn(), close: vi.fn(), isUnlocked: vi.fn(), isFirstLaunch: vi.fn() },
    user: { getUsername: vi.fn(), setUsername: vi.fn() },
    entries: {
      getByDate: vi.fn(),
      create: vi.fn(),
      updateTitle: vi.fn(),
      toggleBookmark: vi.fn(),
      getAllBookmarked: vi.fn()
    },
    entryWritings: {
      getWritingsForEntry: vi.fn(),
      updateWritingContent: vi.fn()
    },
    entryWidgets: {
      getWidgetsForEntry: vi.fn()
    },
    todos: {
      createTodo: vi.fn(),
      getTodosForDate: vi.fn(),
      toggleTodoCompleted: vi.fn(),
      deleteTodo: vi.fn(),
      updateTodoLabel: vi.fn(),
      changeTodoPosition: vi.fn()
    },
    moodTags: {
      getAllMoodTags: vi.fn(),
      getMoodTagsForEntry: vi.fn(),
      addMoodTagToEntry: vi.fn(),
      removeMoodTagFromEntry: vi.fn(),
      removeMoodTag: vi.fn(),
      createMoodTag: vi.fn()
    },
    habit: {
      getActiveHabits: vi.fn().mockResolvedValue([]),
      createHabit: vi.fn().mockResolvedValue(null),
      archiveHabit: vi.fn(),
      unarchiveHabit: vi.fn(),
      updateHabit: vi.fn(),
      getHabitLogForDate: vi.fn().mockResolvedValue(null),
      toggleHabitCompleted: vi.fn().mockResolvedValue(undefined),
      pauseHabit: vi.fn(),
      resumeHabit: vi.fn(),
      calculateStreak: vi.fn()
    }
  } as never
})

describe('HabitTrackerWidget', () => {
  describe('initial render', () => {
    it('fetches active habits on mount', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalled()
      })
    })

    it('fetches the habit log for each active habit using the entry date', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1 }),
        baseHabit({ id: 2, name: 'Cycling' })
      ])

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.habit.getHabitLogForDate).toHaveBeenCalledWith(1, ENTRY_DATE)
        expect(window.api.habit.getHabitLogForDate).toHaveBeenCalledWith(2, ENTRY_DATE)
      })
    })

    it('renders a label for each active habit', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' }),
        baseHabit({ id: 2, name: 'Cycling' })
      ])

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByText('Running')).toBeInTheDocument()
      expect(await screen.findByText('Cycling')).toBeInTheDocument()
    })

    it('renders the checkbox as unchecked when no log exists for that date', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' })
      ])

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByRole('checkbox', { name: /Running/i })).not.toBeChecked()
    })

    it('renders the checkbox as unchecked when the log for that date is not completed', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' })
      ])
      vi.mocked(window.api.habit.getHabitLogForDate).mockResolvedValue(
        baseLog({ completed: false })
      )

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByRole('checkbox', { name: /Running/i })).not.toBeChecked()
    })

    it('renders the checkbox as checked when the log for that date is completed', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' })
      ])
      vi.mocked(window.api.habit.getHabitLogForDate).mockResolvedValue(baseLog({ completed: true }))

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByRole('checkbox', { name: /Running/i })).toBeChecked()
    })

    it('renders no checkboxes when there are no active habits', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalled()
      })

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('toggle habit', () => {
    it('calls toggleHabitCompleted with the correct habitId and entryDate', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 42, name: 'Running' })
      ])

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await userEvent.click(await screen.findByRole('checkbox', { name: /Running/i }))

      expect(window.api.habit.toggleHabitCompleted).toHaveBeenCalledWith(42, ENTRY_DATE)
    })

    it('optimistically checks the checkbox before the API resolves', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' })
      ])
      vi.mocked(window.api.habit.toggleHabitCompleted).mockImplementation(
        () => new Promise(() => {}) // intentionally never resolves
      )

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      const checkbox = await screen.findByRole('checkbox', { name: /Running/i })
      expect(checkbox).not.toBeChecked()

      userEvent.click(checkbox) // not awaited — API never resolves

      await waitFor(() => {
        expect(checkbox).toBeChecked()
      })
    })

    it('optimistically unchecks a checked habit before the API resolves', async () => {
      vi.mocked(window.api.habit.getActiveHabits).mockResolvedValue([
        baseHabit({ id: 1, name: 'Running' })
      ])
      vi.mocked(window.api.habit.getHabitLogForDate).mockResolvedValue(baseLog({ completed: true }))
      vi.mocked(window.api.habit.toggleHabitCompleted).mockImplementation(
        () => new Promise(() => {}) // intentionally never resolves
      )

      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      const checkbox = await screen.findByRole('checkbox', { name: /Running/i })
      expect(checkbox).toBeChecked()

      userEvent.click(checkbox) // not awaited — API never resolves

      await waitFor(() => {
        expect(checkbox).not.toBeChecked()
      })
    })
  })

  describe('add habit', () => {
    it('does not call createHabit when the input is empty', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await userEvent.click(screen.getByRole('button', { name: '+' }))

      expect(window.api.habit.createHabit).not.toHaveBeenCalled()
    })

    it('does not call createHabit when the input is whitespace only', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await userEvent.type(screen.getByRole('textbox'), '   ')
      await userEvent.click(screen.getByRole('button', { name: '+' }))

      expect(window.api.habit.createHabit).not.toHaveBeenCalled()
    })

    it('calls createHabit with the trimmed name and the selected color', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await userEvent.type(screen.getByRole('textbox'), '  Running  ')
      await userEvent.click(screen.getByRole('button', { name: '+' }))

      expect(window.api.habit.createHabit).toHaveBeenCalledWith('Running', '#6586db')
    })

    it('clears the text input after a successful add', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Running')
      await userEvent.click(screen.getByRole('button', { name: '+' }))

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('refetches active habits after adding', async () => {
      render(<HabitTrackerWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalledTimes(1)
      })

      await userEvent.type(screen.getByRole('textbox'), 'Running')
      await userEvent.click(screen.getByRole('button', { name: '+' }))

      await waitFor(() => {
        expect(window.api.habit.getActiveHabits).toHaveBeenCalledTimes(2)
      })
    })
  })
})
