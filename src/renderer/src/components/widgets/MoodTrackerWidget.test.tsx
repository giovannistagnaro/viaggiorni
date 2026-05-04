import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MoodTrackerWidget from './MoodTrackerWidget'
import type { MoodTag } from '@shared/types'

const ENTRY_ID = 1

const baseTag = (overrides: Partial<MoodTag> = {}): MoodTag => ({
  id: 1,
  label: 'Calm',
  isDefault: true,
  createdAt: '2026-05-01T00:00:00',
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
      getAllMoodTags: vi.fn().mockResolvedValue([]),
      getMoodTagsForEntry: vi.fn().mockResolvedValue([]),
      addMoodTagToEntry: vi.fn().mockResolvedValue(undefined),
      removeMoodTagFromEntry: vi.fn().mockResolvedValue(undefined),
      removeMoodTag: vi.fn().mockResolvedValue(undefined),
      createMoodTag: vi.fn().mockResolvedValue(undefined)
    }
  } as never
})

describe('MoodTrackerWidget', () => {
  describe('initial render', () => {
    it('fetches all mood tags and selected mood tags on mount', async () => {
      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      await waitFor(() => {
        expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalled()
        expect(window.api.moodTags.getMoodTagsForEntry).toHaveBeenCalledWith(ENTRY_ID)
      })
    })

    it('renders all available mood tag labels', async () => {
      vi.mocked(window.api.moodTags.getAllMoodTags).mockResolvedValue([
        baseTag({ id: 1, label: 'Calm' }),
        baseTag({ id: 2, label: 'Anxious' })
      ])

      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      expect(await screen.findByText('Calm')).toBeInTheDocument()
      expect(await screen.findByText('Anxious')).toBeInTheDocument()
    })
  })

  describe('toggle selection', () => {
    it('calls addMoodTagToEntry when an unselected tag is clicked', async () => {
      vi.mocked(window.api.moodTags.getAllMoodTags).mockResolvedValue([
        baseTag({ id: 7, label: 'Calm' })
      ])

      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      const tag = await screen.findByText('Calm')
      await userEvent.click(tag)

      expect(window.api.moodTags.addMoodTagToEntry).toHaveBeenCalledWith(ENTRY_ID, 7)
    })

    it('calls removeMoodTagFromEntry when an already-selected tag is clicked', async () => {
      const calm = baseTag({ id: 7, label: 'Calm' })
      vi.mocked(window.api.moodTags.getAllMoodTags).mockResolvedValue([calm])
      vi.mocked(window.api.moodTags.getMoodTagsForEntry).mockResolvedValue([calm])

      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      const tag = await screen.findByText('Calm')
      await userEvent.click(tag)

      expect(window.api.moodTags.removeMoodTagFromEntry).toHaveBeenCalledWith(ENTRY_ID, 7)
    })
  })

  describe('add new tag', () => {
    it('disables the + button when input is empty', () => {
      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      expect(screen.getByRole('button', { name: 'Add new mood tag' })).toBeDisabled()
    })

    it('disables the + button when input is whitespace only', async () => {
      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      await userEvent.type(screen.getByRole('textbox'), '   ')

      expect(screen.getByRole('button', { name: 'Add new mood tag' })).toBeDisabled()
    })

    it('calls createMoodTag with the trimmed label', async () => {
      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      await userEvent.type(screen.getByRole('textbox'), '  Excited  ')
      await userEvent.click(screen.getByRole('button', { name: 'Add new mood tag' }))

      expect(window.api.moodTags.createMoodTag).toHaveBeenCalledWith('Excited')
    })

    it('clears the input after a successful add', async () => {
      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Excited')
      await userEvent.click(screen.getByRole('button', { name: 'Add new mood tag' }))

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('refetches all mood tags after adding', async () => {
      render(<MoodTrackerWidget entryId={ENTRY_ID} />)

      await waitFor(() => {
        expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalledTimes(1)
      })

      await userEvent.type(screen.getByRole('textbox'), 'Excited')
      await userEvent.click(screen.getByRole('button', { name: 'Add new mood tag' }))

      await waitFor(() => {
        expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalledTimes(2)
      })
    })
  })
})
