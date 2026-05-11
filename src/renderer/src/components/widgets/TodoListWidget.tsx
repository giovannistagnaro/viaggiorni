import { formatDateISO } from '@renderer/utils/dateFormatters'
import { Todo } from '@shared/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  entryDate: string
}

const ONE_DAY_MS = 86400000

function TodoListWidget({ entryDate }: Props): React.JSX.Element {
  const [view, setView] = useState<'today' | 'tomorrow'>('today')
  const [todos, setTodos] = useState<Todo[]>([])
  const [newLabel, setNewLabel] = useState('')

  const activeDate = useMemo(
    () =>
      view === 'today'
        ? entryDate
        : formatDateISO(new Date(new Date(entryDate + 'T00:00:00').getTime() + ONE_DAY_MS)),
    [entryDate, view]
  )

  const getActiveDateTodos = useCallback(async () => {
    try {
      const fetchedTodos = await window.api.todos.getTodosForDate(activeDate)
      setTodos(fetchedTodos)
    } catch (err) {
      console.error('Failed to fetch todos', err)
      toast.error('Failed to fetch todos')
    }
  }, [activeDate])

  useEffect(() => {
    async function getActiveDateTodosWrapper(): Promise<void> {
      await getActiveDateTodos()
    }
    getActiveDateTodosWrapper()
  }, [getActiveDateTodos])

  async function handleToggle(todoId: number): Promise<void> {
    try {
      await window.api.todos.toggleTodoCompleted(todoId)
      await getActiveDateTodos()
    } catch (err) {
      console.error('Failed to toggle todo', err)
      toast.error('Failed to toggle todo')
    }
  }

  async function handleAdd(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    const trimmed = newLabel.trim()
    if (!trimmed) return
    try {
      await window.api.todos.createTodo(activeDate, trimmed)
      setNewLabel('')
      await getActiveDateTodos()
    } catch (err) {
      console.error('Failed to add todo', err)
      toast.error('Failed to add todo')
    }
  }

  async function handleDelete(todoId: number): Promise<void> {
    try {
      await window.api.todos.deleteTodo(todoId)
      await getActiveDateTodos()
    } catch (err) {
      console.error('Failed to delete todo', err)
      toast.error('Failed to delete todo')
    }
  }

  async function handleLabelBlur(todo: Todo, newValue: string): Promise<void> {
    const trimmed = newValue.trim()
    if (!trimmed || trimmed === todo.label) return
    try {
      await window.api.todos.updateTodoLabel(todo.id, trimmed)
      await getActiveDateTodos()
    } catch (err) {
      console.error('Failed to update todo label', err)
      toast.error('Failed to update todo label')
    }
  }

  return (
    <div>
      {/* Today / Tomorrow segmented control */}
      <div
        role="radiogroup"
        aria-label="Day view"
        className="grid grid-cols-2 bg-ink/5 rounded-md p-0.5 mb-3 font-serif text-sm"
      >
        <label className="block cursor-pointer">
          <input
            type="radio"
            name="day-view"
            value="today"
            checked={view === 'today'}
            onChange={() => setView('today')}
            className="sr-only"
          />
          <span
            className={`block text-center py-1.5 rounded transition-colors ${
              view === 'today' ? 'bg-ink text-paper font-medium' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Today
          </span>
        </label>
        <label className="block cursor-pointer">
          <input
            type="radio"
            name="day-view"
            value="tomorrow"
            checked={view === 'tomorrow'}
            onChange={() => setView('tomorrow')}
            className="sr-only"
          />
          <span
            className={`block text-center py-1.5 rounded transition-colors ${
              view === 'tomorrow' ? 'bg-ink text-paper font-medium' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Tomorrow
          </span>
        </label>
      </div>

      {/* Todo list */}
      <ul className="divide-y divide-ink/10 max-h-[180px] overflow-y-auto no-scrollbar">
        {todos.map((todo) => (
          <li key={todo.id} className="group flex items-center gap-2 py-1.5">
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => handleToggle(todo.id)}
              className="w-4 h-4 accent-ink cursor-pointer flex-none"
              aria-label={todo.label}
            />
            <input
              type="text"
              defaultValue={todo.label}
              onBlur={(e) => handleLabelBlur(todo, e.target.value)}
              aria-label="Todo label"
              className={`font-serif text-sm flex-1 bg-transparent border-none outline-none focus:outline-1 focus:outline-ink/30 focus:outline-dashed focus:outline-offset-2 rounded ${
                todo.isCompleted ? 'text-ink-soft line-through' : 'text-ink'
              }`}
            />
            <button
              onClick={() => handleDelete(todo.id)}
              aria-label="Delete todo"
              className="font-serif text-ink-soft text-base leading-none opacity-0 group-hover:opacity-100 hover:text-rust transition-opacity px-1"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* Add task */}
      <form
        onSubmit={handleAdd}
        className={`flex items-center gap-2 ${todos.length > 0 ? 'border-t border-ink/10 pt-2 mt-1' : ''}`}
      >
        <span className="font-serif text-sepia text-base leading-none" aria-hidden>
          +
        </span>
        <input
          type="text"
          name="new-label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add task"
          className="font-serif text-ink text-sm flex-1 bg-transparent border-none outline-none focus:outline-1 focus:outline-ink/30 focus:outline-dashed focus:outline-offset-2 rounded placeholder:text-ink-soft/60 placeholder:italic"
        />
        <button
          type="submit"
          disabled={newLabel.trim() === ''}
          aria-label="Add todo"
          className="font-serif text-ink-soft text-xs hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed underline decoration-dotted underline-offset-2"
        >
          Add
        </button>
      </form>
    </div>
  )
}

export default TodoListWidget
