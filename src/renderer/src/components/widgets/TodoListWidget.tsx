import { formatDateISO } from '@renderer/utils/dateFormatters'
import { Todo } from '@shared/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
      // TODO: surface to user via error UI
      console.error('Failed to fetch todos', err)
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
      // TODO: surface to user via error UI
      console.error('Failed to toggle todo', err)
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
      // TODO: surface to user via error UI
      console.error('Failed to add todo', err)
    }
  }

  async function handleDelete(todoId: number): Promise<void> {
    try {
      await window.api.todos.deleteTodo(todoId)
      await getActiveDateTodos()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to delete todo', err)
    }
  }

  async function handleLabelBlur(todo: Todo, newValue: string): Promise<void> {
    const trimmed = newValue.trim()
    if (!trimmed || trimmed === todo.label) return

    try {
      await window.api.todos.updateTodoLabel(todo.id, trimmed)
      await getActiveDateTodos()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to update todo label', err)
    }
  }

  return (
    <>
      <label className="px-4">
        <input
          type="radio"
          name="day-view"
          value="today"
          checked={view === 'today'}
          onChange={() => setView('today')}
        />
        Today
      </label>

      <label>
        <input
          type="radio"
          name="day-view"
          value="tomorrow"
          checked={view === 'tomorrow'}
          onChange={() => setView('tomorrow')}
        />
        Tomorrow
      </label>

      {todos.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            name="complete"
            checked={todo.isCompleted}
            onChange={() => handleToggle(todo.id)}
          />
          <input
            type="text"
            defaultValue={todo.label}
            onBlur={(e) => handleLabelBlur(todo, e.target.value)}
            aria-label="Todo label"
            className="pl-2"
          />
          <button onClick={() => handleDelete(todo.id)} className="pl-4" aria-label="Delete todo">
            -
          </button>
        </div>
      ))}
      <div>
        <form onSubmit={handleAdd}>
          <input
            type="text"
            name="new-label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button type="submit" disabled={newLabel.trim() === ''} aria-label="Add todo">
            +
          </button>
        </form>
      </div>
    </>
  )
}

export default TodoListWidget
