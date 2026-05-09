import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Index from './Index'
import { formatDateISO } from '../utils/dateFormatters'
import type { Entry } from '@shared/types'

const baseEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 1,
  title: 'Bookmarked entry',
  date: '2026-04-15',
  isBookmarked: true,
  createdAt: '2026-04-15 00:00:00',
  updatedAt: null,
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
      getAllBookmarked: vi.fn().mockResolvedValue([]),
      getAllDates: vi.fn().mockResolvedValue([])
    },
    entryWritings: {
      getWritingsForEntry: vi.fn(),
      updateWritingContent: vi.fn(),
      updateWritingPrompt: vi.fn(),
      getOrCreatePromptForWriting: vi.fn()
    },
    entryWidgets: { getWidgetsForEntry: vi.fn() },
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
    wordOfDay: { getOrCreateForDate: vi.fn() },
    entryPhotos: {
      createPhoto: vi.fn(),
      getPhotoById: vi.fn(),
      getPhotosForEntry: vi.fn(),
      deletePhoto: vi.fn(),
      updatePhotoCaption: vi.fn(),
      changePhotoPosition: vi.fn()
    }
  } as never
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Index', () => {
  describe('initial render', () => {
    it('fetches bookmarks and entry dates on mount', async () => {
      render(<Index onNavigateToDay={vi.fn()} />)

      await waitFor(() => {
        expect(window.api.entries.getAllBookmarked).toHaveBeenCalled()
        expect(window.api.entries.getAllDates).toHaveBeenCalled()
      })
    })

    it('renders the calendar', () => {
      render(<Index onNavigateToDay={vi.fn()} />)

      // shadcn calendar exposes a grid role for the date cells
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    it('renders Today and Yesterday quick-jump buttons', () => {
      render(<Index onNavigateToDay={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument()
    })
  })

  describe('bookmarks list', () => {
    it('renders nothing in the list when no bookmarks exist', async () => {
      vi.mocked(window.api.entries.getAllBookmarked).mockResolvedValue([])

      render(<Index onNavigateToDay={vi.fn()} />)

      await waitFor(() => {
        expect(window.api.entries.getAllBookmarked).toHaveBeenCalled()
      })
      // No level-2 headings = no bookmark items
      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    })

    it('renders a button per bookmarked entry with date and title', async () => {
      const bookmark = baseEntry({ id: 7, date: '2026-04-15', title: 'A trip' })
      vi.mocked(window.api.entries.getAllBookmarked).mockResolvedValue([bookmark])

      render(<Index onNavigateToDay={vi.fn()} />)

      expect(await screen.findByText('2026-04-15 - A trip')).toBeInTheDocument()
    })

    it('navigates to the entry date when a bookmark is clicked', async () => {
      const bookmark = baseEntry({ id: 7, date: '2026-04-15', title: 'A trip' })
      vi.mocked(window.api.entries.getAllBookmarked).mockResolvedValue([bookmark])
      const onNavigateToDay = vi.fn()

      render(<Index onNavigateToDay={onNavigateToDay} />)

      const bookmarkButton = await screen.findByRole('button', { name: /A trip/ })
      await userEvent.click(bookmarkButton)

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-04-15')
    })
  })

  describe('quick-jump buttons', () => {
    it("Today calls onNavigateToDay with today's ISO date", async () => {
      const onNavigateToDay = vi.fn()
      render(<Index onNavigateToDay={onNavigateToDay} />)

      await userEvent.click(screen.getByRole('button', { name: 'Today' }))

      const today = formatDateISO(new Date())
      expect(onNavigateToDay).toHaveBeenCalledWith(today)
    })

    it("Yesterday calls onNavigateToDay with yesterday's ISO date", async () => {
      const onNavigateToDay = vi.fn()
      render(<Index onNavigateToDay={onNavigateToDay} />)

      await userEvent.click(screen.getByRole('button', { name: 'Yesterday' }))

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(onNavigateToDay).toHaveBeenCalledWith(formatDateISO(yesterday))
    })
  })
})
