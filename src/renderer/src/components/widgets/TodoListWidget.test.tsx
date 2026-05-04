import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoListWidget from './TodoListWidget'
import type { Todo } from '@shared/types'

const ENTRY_DATE = '2026-05-03'
const TOMORROW_DATE = '2026-05-04'

const baseTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  entryDate: ENTRY_DATE,
  label: 'Default',
  isCompleted: false,
  position: 0,
  createdAt: '2026-05-03T00:00:00',
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
      getAllBookmarked: vi.fn()
    },
    entrySections: {
      getSectionsForEntry: vi.fn(),
      updateSectionContent: vi.fn()
    },
    entryWidgets: {
      getWidgetsForEntry: vi.fn()
    },
    todos: {
      createTodo: vi.fn(),
      getTodosForDate: vi.fn().mockResolvedValue([]),
      toggleTodoCompleted: vi.fn().mockResolvedValue(undefined),
      deleteTodo: vi.fn().mockResolvedValue(undefined),
      updateTodoLabel: vi.fn(),
      changeTodoPosition: vi.fn()
    }
  } as never
})

describe('TodoListWidget', () => {
  describe('initial render', () => {
    it('fetches todos for the entry date on mount', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalledWith(ENTRY_DATE)
      })
    })

    it('renders fetched todo labels', async () => {
      vi.mocked(window.api.todos.getTodosForDate).mockResolvedValue([
        baseTodo({ id: 1, label: 'Buy milk' }),
        baseTodo({ id: 2, label: 'Walk dog', position: 1 })
      ])

      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      expect(await screen.findByDisplayValue('Buy milk')).toBeInTheDocument()
      expect(await screen.findByDisplayValue('Walk dog')).toBeInTheDocument()
    })

    it('renders nothing in the list when there are no todos', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalled()
      })
      expect(screen.queryByRole('checkbox', { name: /complete/i })).not.toBeInTheDocument()
    })
  })

  describe('today/tomorrow toggle', () => {
    it('refetches todos for tomorrow when tomorrow is selected', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalledWith(ENTRY_DATE)
      })

      await userEvent.click(screen.getByRole('radio', { name: /tomorrow/i }))

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalledWith(TOMORROW_DATE)
      })
    })

    it('refetches todos for today when today is reselected', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await userEvent.click(screen.getByRole('radio', { name: /tomorrow/i }))
      vi.mocked(window.api.todos.getTodosForDate).mockClear()
      await userEvent.click(screen.getByRole('radio', { name: /today/i }))

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalledWith(ENTRY_DATE)
      })
    })
  })

  describe('add todo', () => {
    it('disables the + button when input is empty', () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      expect(screen.getByRole('button', { name: 'Add todo' })).toBeDisabled()
    })

    it('disables the + button when input is whitespace only', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await userEvent.type(screen.getByRole('textbox'), '   ')

      expect(screen.getByRole('button', { name: 'Add todo' })).toBeDisabled()
    })

    it('calls createTodo with the trimmed label and active date', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await userEvent.type(screen.getByRole('textbox'), '  Buy milk  ')
      await userEvent.click(screen.getByRole('button', { name: 'Add todo' }))

      expect(window.api.todos.createTodo).toHaveBeenCalledWith(ENTRY_DATE, 'Buy milk')
    })

    it('clears the input after a successful add', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Buy milk')
      await userEvent.click(screen.getByRole('button', { name: 'Add todo' }))

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('refetches todos after adding', async () => {
      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalledTimes(1)
      })

      await userEvent.type(screen.getByRole('textbox'), 'Buy milk')
      await userEvent.click(screen.getByRole('button', { name: 'Add todo' }))

      await waitFor(() => {
        expect(window.api.todos.getTodosForDate).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('toggle completion', () => {
    it('calls toggleTodoCompleted with the correct id when checkbox is clicked', async () => {
      vi.mocked(window.api.todos.getTodosForDate).mockResolvedValue([
        baseTodo({ id: 42, label: 'Buy milk' })
      ])

      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      const checkbox = await screen.findByRole('checkbox')
      await userEvent.click(checkbox)

      expect(window.api.todos.toggleTodoCompleted).toHaveBeenCalledWith(42)
    })
  })

  describe('delete todo', () => {
    it('calls deleteTodo with the correct id when - button is clicked', async () => {
      vi.mocked(window.api.todos.getTodosForDate).mockResolvedValue([
        baseTodo({ id: 42, label: 'Buy milk' })
      ])

      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      await screen.findByDisplayValue('Buy milk')
      await userEvent.click(screen.getByRole('button', { name: 'Delete todo' }))

      expect(window.api.todos.deleteTodo).toHaveBeenCalledWith(42)
    })
  })

  describe('edit label', () => {
    it('calls updateTodoLabel with the trimmed value on blur when changed', async () => {
      vi.mocked(window.api.todos.getTodosForDate).mockResolvedValue([
        baseTodo({ id: 42, label: 'Buy milk' })
      ])

      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      const input = await screen.findByDisplayValue('Buy milk')
      await userEvent.tripleClick(input)
      await userEvent.keyboard('  Buy oat milk  ')
      await userEvent.tab()

      expect(window.api.todos.updateTodoLabel).toHaveBeenCalledWith(42, 'Buy oat milk')
    })

    it('does not call updateTodoLabel when the label is unchanged', async () => {
      vi.mocked(window.api.todos.getTodosForDate).mockResolvedValue([
        baseTodo({ id: 42, label: 'Buy milk' })
      ])

      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      const input = await screen.findByDisplayValue('Buy milk')
      await userEvent.click(input)
      await userEvent.tab()

      expect(window.api.todos.updateTodoLabel).not.toHaveBeenCalled()
    })

    it('does not call updateTodoLabel when the new value is empty or whitespace', async () => {
      vi.mocked(window.api.todos.getTodosForDate).mockResolvedValue([
        baseTodo({ id: 42, label: 'Buy milk' })
      ])

      render(<TodoListWidget entryDate={ENTRY_DATE} />)

      const input = await screen.findByDisplayValue('Buy milk')
      await userEvent.tripleClick(input)
      await userEvent.keyboard('   ')
      await userEvent.tab()

      expect(window.api.todos.updateTodoLabel).not.toHaveBeenCalled()
    })
  })
})
