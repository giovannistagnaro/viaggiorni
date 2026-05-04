import { ipcMain } from 'electron'
import {
  changeTodoPosition,
  createTodo,
  deleteTodo,
  getTodosForDate,
  toggleTodoCompleted,
  updateTodoLabel
} from '../db/queries/todos'
import { getDB } from '../db'
import log from 'electron-log'

export function registerTodosIpc(): void {
  ipcMain.handle('todos:createTodo', (_, entryDate: string, label: string) => {
    try {
      return createTodo(getDB(), entryDate, label)
    } catch (err) {
      log.error('Failed to create todo', { error: err })
      throw err
    }
  })
  ipcMain.handle('todos:getTodosForDate', (_, entryDate: string) => {
    try {
      return getTodosForDate(getDB(), entryDate)
    } catch (err) {
      log.error('Failed to find matching todos for date', { entryDate, error: err })
      throw err
    }
  })
  ipcMain.handle('todos:toggleTodoCompleted', (_, todoId: number) => {
    try {
      toggleTodoCompleted(getDB(), todoId)
    } catch (err) {
      log.error('Failed to toggle todo completion status', { todoId, error: err })
      throw err
    }
  })
  ipcMain.handle('todos:deleteTodo', (_, todoId: number) => {
    try {
      deleteTodo(getDB(), todoId)
    } catch (err) {
      log.error('Failed to delete todo', { todoId, error: err })
      throw err
    }
  })
  ipcMain.handle('todos:updateTodoLabel', (_, todoId: number, newLabel: string) => {
    try {
      updateTodoLabel(getDB(), todoId, newLabel)
    } catch (err) {
      log.error('Failed to update todo label', { todoId, error: err })
      throw err
    }
  })
  ipcMain.handle('todos:changeTodoPosition', (_, todoId: number, newPosition: number) => {
    try {
      changeTodoPosition(getDB(), todoId, newPosition)
    } catch (err) {
      log.error('Failed to change todo position', { todoId, error: err })
      throw err
    }
  })
}
