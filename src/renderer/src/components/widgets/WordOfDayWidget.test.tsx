import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import WordOfDayWidget from './WordOfDayWidget'
import type { WordOfDay } from '@shared/types'

const ENTRY_DATE = '2026-05-04'
const NEXT_DATE = '2026-05-05'

const baseWord = (overrides: Partial<WordOfDay> = {}): WordOfDay => ({
  id: 1,
  entryDate: ENTRY_DATE,
  word: 'ephemeral',
  definition: 'Lasting a very short time.',
  example: 'A fleeting smile.',
  source: 'local',
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
      getActiveHabits: vi.fn(),
      createHabit: vi.fn(),
      archiveHabit: vi.fn(),
      unarchiveHabit: vi.fn(),
      updateHabit: vi.fn(),
      getHabitLogForDate: vi.fn(),
      toggleHabitCompleted: vi.fn(),
      pauseHabit: vi.fn(),
      resumeHabit: vi.fn(),
      calculateStreak: vi.fn()
    },
    wordOfDay: {
      getOrCreateForDate: vi.fn().mockResolvedValue(null)
    }
  } as never
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WordOfDayWidget', () => {
  describe('initial render', () => {
    it('shows a loading state before the IPC resolves', () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockImplementation(
        () => new Promise(() => {}) // never resolves
      )

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('calls getOrCreateForDate with the entry date on mount', async () => {
      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.wordOfDay.getOrCreateForDate).toHaveBeenCalledWith(ENTRY_DATE)
      })
    })
  })

  describe('after fetch resolves with a word', () => {
    it('renders the word', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(
        baseWord({ word: 'serendipity' })
      )

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByText('serendipity')).toBeInTheDocument()
    })

    it('renders the definition', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(
        baseWord({ definition: 'A pleasant surprise.' })
      )

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByText(/A pleasant surprise\./)).toBeInTheDocument()
    })

    it('renders the example', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(
        baseWord({ example: 'A serendipitous meeting on the train.' })
      )

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByText(/A serendipitous meeting on the train\./)).toBeInTheDocument()
    })

    it('removes the loading state once the fetch resolves', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(baseWord())

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('after fetch resolves with null', () => {
    it('shows the unavailable fallback message', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(null)

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByText(/no word available/i)).toBeInTheDocument()
    })

    it('does not render any word content', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(null)

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      await screen.findByText(/no word available/i)
      expect(screen.queryByText(/Definition:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Example:/)).not.toBeInTheDocument()
    })
  })

  describe('when the IPC call rejects', () => {
    it('logs the error and shows the unavailable fallback message', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockRejectedValue(new Error('IPC failed'))

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByText(/no word available/i)).toBeInTheDocument()
      expect(consoleError).toHaveBeenCalled()
    })

    it('clears the loading state', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockRejectedValue(new Error('IPC failed'))

      render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('when entryDate changes', () => {
    it('refetches the word for the new date', async () => {
      vi.mocked(window.api.wordOfDay.getOrCreateForDate).mockResolvedValue(baseWord())

      const { rerender } = render(<WordOfDayWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.wordOfDay.getOrCreateForDate).toHaveBeenCalledWith(ENTRY_DATE)
      })

      rerender(<WordOfDayWidget entryDate={NEXT_DATE} />)

      await waitFor(() => {
        expect(window.api.wordOfDay.getOrCreateForDate).toHaveBeenCalledWith(NEXT_DATE)
      })
    })
  })
})
