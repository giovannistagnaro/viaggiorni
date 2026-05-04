import { DrizzleDB } from '../database'
import { createEntry } from './entries'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import {
  changeTodoPosition,
  createTodo,
  deleteTodo,
  getTodosForDate,
  toggleTodoCompleted,
  updateTodoLabel
} from './todos'
import { todos } from '../schema'
import { eq } from 'drizzle-orm'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('createTodo', () => {
  it('returns a todo with the correct label and position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoLabel1 = 'Label 1'
    const todoLabel2 = 'Label 2'
    const todo1 = createTodo(db, entry.date, todoLabel1)
    const todo2 = createTodo(db, entry.date, todoLabel2)

    expect(todo1.label).toEqual(todoLabel1)
    expect(todo2.label).toEqual(todoLabel2)

    expect(todo1.position).toEqual(0)
    expect(todo2.position).toEqual(1)
  })
})

describe('getTodosForDate', () => {
  it('returns empty array when no todos found', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const todos = getTodosForDate(db, entry.date)

    expect(todos).toEqual([])
  })

  it('returns todos only for the specific day', () => {
    const entry1 = createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createTodo(db, entry1.date, 'Label 1.1')
    createTodo(db, entry1.date, 'Label 1.2')
    createTodo(db, entry1.date, 'Label 1.3')

    createTodo(db, entry2.date, 'Label 2.1')
    createTodo(db, entry2.date, 'Label 2.2')

    const todos = getTodosForDate(db, entry2.date)

    expect(todos.length).toBeGreaterThan(0)
    expect(todos.every((todo) => todo.entryDate === entry2.date)).toBe(true)
  })

  it('orders incomplete todos by position ascending', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoLabel1 = 'Label 1'
    const todoLabel2 = 'Label 2'
    createTodo(db, entry.date, todoLabel1)
    createTodo(db, entry.date, todoLabel2)

    const todos = getTodosForDate(db, entry.date)

    expect(todos.length).toBeGreaterThan(0)
    expect(todos.map((todo) => todo.position)).toEqual(
      todos.map((todo) => todo.position).sort((a, b) => a - b)
    )
  })

  it('places completed todos after incomplete ones regardless of position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoA = createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    const todoC = createTodo(db, entry.date, 'C')

    toggleTodoCompleted(db, todoA.id)

    const result = getTodosForDate(db, entry.date)
    expect(result.map((t) => t.id)).toEqual([todoB.id, todoC.id, todoA.id])
  })
})

describe('toggleTodoCompleted', () => {
  it('sets isCompleted from false to true', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todo = createTodo(db, entry.date, 'Label 1')

    toggleTodoCompleted(db, todo.id)

    const updatedTodo = db.select().from(todos).where(eq(todos.id, todo.id)).get()
    expect(updatedTodo?.isCompleted).toBe(true)
  })

  it('sets isCompleted from true to false', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todo = createTodo(db, entry.date, 'Label 1')

    toggleTodoCompleted(db, todo.id)
    toggleTodoCompleted(db, todo.id)

    const updatedTodo = db.select().from(todos).where(eq(todos.id, todo.id)).get()
    expect(updatedTodo?.isCompleted).toBe(false)
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todo = createTodo(db, entry.date, 'Label 1')

    toggleTodoCompleted(db, todo.id)

    const updated = db.select().from(todos).where(eq(todos.id, todo.id)).get()
    expect(updated?.updatedAt).not.toBeNull()
  })
})

describe('deleteTodo', () => {
  it('deletes only the specified todo', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    createTodo(db, entry.date, 'Label 1')
    const todoToDelete = createTodo(db, entry.date, 'Label 2')
    createTodo(db, entry.date, 'Label 3')

    deleteTodo(db, todoToDelete.id)
    const todos = getTodosForDate(db, entry.date)

    expect(todos.length).toEqual(2)
    expect(todos.map((todo) => todo.label).sort()).toEqual(['Label 1', 'Label 3'])
  })

  it('updates only the position of the todos after the deleted todo', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    createTodo(db, entry.date, 'Label 1')
    const todoToDelete = createTodo(db, entry.date, 'Label 2')
    createTodo(db, entry.date, 'Label 3')

    deleteTodo(db, todoToDelete.id)
    const todos = getTodosForDate(db, entry.date)

    expect(todos.length).toEqual(2)
    expect(todos.map((todo) => todo.position).sort()).toEqual([0, 1])
  })
})

describe('updateTodoLabel', () => {
  it('updates the label of an existing todo', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todo = createTodo(db, entry.date, 'Label')

    const newLabel = 'New Label'
    updateTodoLabel(db, todo.id, newLabel)
    const updatedTodo = getTodosForDate(db, entry.date)

    expect(updatedTodo.length).toEqual(1)
    expect(updatedTodo[0].label).toEqual(newLabel)
  })

  it('updates the updatedAt timestamp', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todo = createTodo(db, entry.date, 'Label')

    updateTodoLabel(db, todo.id, 'New Label')

    const updated = db.select().from(todos).where(eq(todos.id, todo.id)).get()
    expect(updated?.updatedAt).not.toBeNull()
  })
})

describe('changeTodoPosition', () => {
  it('moves a todo to a higher position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoA = createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    const todoC = createTodo(db, entry.date, 'C')

    changeTodoPosition(db, todoA.id, 2)

    const result = getTodosForDate(db, entry.date)
    expect(result.map((t) => t.id)).toEqual([todoB.id, todoC.id, todoA.id])
  })

  it('moves a todo to a lower position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoA = createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    const todoC = createTodo(db, entry.date, 'C')

    changeTodoPosition(db, todoC.id, 0)

    const result = getTodosForDate(db, entry.date)
    expect(result.map((t) => t.id)).toEqual([todoC.id, todoA.id, todoB.id])
  })

  it('does nothing when newPosition equals current position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoA = createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    const todoC = createTodo(db, entry.date, 'C')

    changeTodoPosition(db, todoB.id, 1)

    const result = getTodosForDate(db, entry.date)
    expect(result.map((t) => t.id)).toEqual([todoA.id, todoB.id, todoC.id])
  })

  it('clamps newPosition higher than max to the end', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoA = createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    const todoC = createTodo(db, entry.date, 'C')

    changeTodoPosition(db, todoA.id, 999)

    const result = getTodosForDate(db, entry.date)
    expect(result.map((t) => t.id)).toEqual([todoB.id, todoC.id, todoA.id])
  })

  it('clamps negative newPosition to the start', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const todoA = createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    const todoC = createTodo(db, entry.date, 'C')

    changeTodoPosition(db, todoC.id, -5)

    const result = getTodosForDate(db, entry.date)
    expect(result.map((t) => t.id)).toEqual([todoC.id, todoA.id, todoB.id])
  })

  it('preserves the total count of todos', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    createTodo(db, entry.date, 'A')
    const todoB = createTodo(db, entry.date, 'B')
    createTodo(db, entry.date, 'C')

    changeTodoPosition(db, todoB.id, 0)

    const result = getTodosForDate(db, entry.date)
    expect(result.length).toBe(3)
  })
})
