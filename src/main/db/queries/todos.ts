import { Todo } from '@shared/types'
import { DrizzleDB } from '../database'
import { todos } from '../schema'
import { eq, max, asc, gt, lt, and, lte, gte, sql } from 'drizzle-orm'

export function createTodo(db: DrizzleDB, entryDate: string, label: string): Todo {
  const maxRow = db
    .select({ maxPosition: max(todos.position) })
    .from(todos)
    .get()

  const nextPosition = (maxRow?.maxPosition ?? -1) + 1

  return db.insert(todos).values({ entryDate, label, position: nextPosition }).returning().get()
}

export function getTodosForDate(db: DrizzleDB, entryDate: string): Todo[] {
  return db
    .select()
    .from(todos)
    .where(eq(todos.entryDate, entryDate))
    .orderBy(asc(todos.isCompleted), asc(todos.position))
    .all()
}

export function toggleTodoCompleted(db: DrizzleDB, todoId: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ isCompleted: todos.isCompleted })
      .from(todos)
      .where(eq(todos.id, todoId))
      .get()

    if (!row) throw new Error(`Todo item not found`)

    tx.update(todos)
      .set({ isCompleted: !row.isCompleted, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(todos.id, todoId))
      .run()
  })
}

export function deleteTodo(db: DrizzleDB, todoId: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: todos.position })
      .from(todos)
      .where(eq(todos.id, todoId))
      .get()

    if (!row) throw new Error(`Todo item not found`)
    const deletedPosition = row.position

    tx.delete(todos).where(eq(todos.id, todoId)).run()

    tx.update(todos)
      .set({ position: sql`${todos.position} - 1`, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(gt(todos.position, deletedPosition))
      .run()
  })
}

export function updateTodoLabel(db: DrizzleDB, todoId: number, newLabel: string): void {
  db.update(todos)
    .set({ label: newLabel, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(todos.id, todoId))
    .run()
}

export function changeTodoPosition(db: DrizzleDB, todoId: number, newPosition: number): void {
  db.transaction((tx) => {
    const row = tx
      .select({ position: todos.position })
      .from(todos)
      .where(eq(todos.id, todoId))
      .get()

    if (!row) throw new Error(`Todo item not found`)

    const maxRow = tx
      .select({ maxPosition: max(todos.position) })
      .from(todos)
      .get()

    const maxPosition = maxRow?.maxPosition ?? 1

    newPosition = Math.max(0, Math.min(newPosition, maxPosition))

    const oldPosition = row.position

    if (newPosition > oldPosition) {
      tx.update(todos)
        .set({ position: sql`${todos.position} - 1`, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(gt(todos.position, oldPosition), lte(todos.position, newPosition)))
        .run()
    } else if (newPosition < oldPosition) {
      tx.update(todos)
        .set({ position: sql`${todos.position} + 1`, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(lt(todos.position, oldPosition), gte(todos.position, newPosition)))
        .run()
    } else {
      return
    }
    tx.update(todos)
      .set({ position: newPosition, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(todos.id, todoId))
      .run()
  })
}
