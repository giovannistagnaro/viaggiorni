import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import WritingEditor from './WritingEditor'

const ENTRY_DATE = '2026-05-04'

const baseWriting = {
  id: 1,
  type: 'daily_summary' as const,
  label: 'Daily Summary',
  content: null,
  prompt: null
}

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
      updateWritingContent: vi.fn(),
      updateWritingPrompt: vi.fn(),
      getOrCreatePromptForWriting: vi.fn().mockResolvedValue(null)
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
    wordOfDay: { getOrCreateForDate: vi.fn() }
  } as never
})

describe('WritingEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the writing label when present', () => {
    render(<WritingEditor writing={baseWriting} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Daily Summary' })).toBeInTheDocument()
  })

  it('does not render a heading when label is null', () => {
    const nullLabelWriting = { ...baseWriting, label: null }
    render(<WritingEditor writing={nullLabelWriting} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders the editor', () => {
    const { container } = render(
      <WritingEditor writing={baseWriting} entryDate={ENTRY_DATE} onSave={vi.fn()} />
    )

    expect(container.querySelector('.ProseMirror')).toBeInTheDocument()
  })

  it('initializes the editor with parsed content from writing.content', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] }]
    })
    const writingWithContent = { ...baseWriting, content }

    const { container } = render(
      <WritingEditor writing={writingWithContent} entryDate={ENTRY_DATE} onSave={vi.fn()} />
    )

    expect(container.querySelector('.ProseMirror')).toHaveTextContent('hello world')
  })

  it('renders an empty editor when writing.content is null', () => {
    render(<WritingEditor writing={baseWriting} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

    const editor = document.querySelector('.ProseMirror')
    expect(editor?.textContent).toBe('')
  })

  describe('writing prompt fetching', () => {
    it('does not fetch a prompt for non-writing_prompt writings', () => {
      render(<WritingEditor writing={baseWriting} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

      expect(window.api.entryWritings.getOrCreatePromptForWriting).not.toHaveBeenCalled()
    })

    it('does not fetch a prompt when one is already set', () => {
      const existing = {
        ...baseWriting,
        type: 'writing_prompt' as const,
        prompt: 'existing prompt'
      }
      render(<WritingEditor writing={existing} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

      expect(window.api.entryWritings.getOrCreatePromptForWriting).not.toHaveBeenCalled()
    })

    it('renders a pre-existing prompt without fetching', () => {
      const existing = {
        ...baseWriting,
        type: 'writing_prompt' as const,
        prompt: 'Describe a place you have been to that no longer exists.'
      }
      render(<WritingEditor writing={existing} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

      expect(
        screen.getByRole('heading', {
          level: 3,
          name: /Describe a place you have been to that no longer exists\./
        })
      ).toBeInTheDocument()
    })

    it('fetches a prompt for writing_prompt rows with no prompt set', async () => {
      vi.useRealTimers()
      const writing = { ...baseWriting, type: 'writing_prompt' as const, prompt: null }

      render(<WritingEditor writing={writing} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

      await waitFor(() => {
        expect(window.api.entryWritings.getOrCreatePromptForWriting).toHaveBeenCalledWith(
          writing.id,
          ENTRY_DATE
        )
      })
    })

    it('renders the fetched prompt once the IPC resolves', async () => {
      vi.useRealTimers()
      vi.mocked(window.api.entryWritings.getOrCreatePromptForWriting).mockResolvedValue(
        'A fetched prompt'
      )
      const writing = { ...baseWriting, type: 'writing_prompt' as const, prompt: null }

      render(<WritingEditor writing={writing} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

      expect(
        await screen.findByRole('heading', { level: 3, name: 'A fetched prompt' })
      ).toBeInTheDocument()
    })

    it('does not render a level-3 heading when fetch returns null', async () => {
      vi.useRealTimers()
      vi.mocked(window.api.entryWritings.getOrCreatePromptForWriting).mockResolvedValue(null)
      const writing = { ...baseWriting, type: 'writing_prompt' as const, prompt: null }

      render(<WritingEditor writing={writing} entryDate={ENTRY_DATE} onSave={vi.fn()} />)

      await waitFor(() => {
        expect(window.api.entryWritings.getOrCreatePromptForWriting).toHaveBeenCalled()
      })
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    })
  })
})
