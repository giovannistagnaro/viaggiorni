import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    open: (password: string) => ipcRenderer.invoke('db:open', password),
    close: () => ipcRenderer.invoke('db:close'),
    isUnlocked: () => ipcRenderer.invoke('db:isUnlocked'),
    isFirstLaunch: () => ipcRenderer.invoke('db:isFirstLaunch')
  },
  user: {
    getUsername: () => ipcRenderer.invoke('user:getUsername'),
    setUsername: (name: string) => ipcRenderer.invoke('user:setUsername', name)
  },
  entries: {
    getByDate: (date: string) => ipcRenderer.invoke('entries:getByDate', date),
    create: (date: string, title: string) => ipcRenderer.invoke('entries:create', date, title),
    updateTitle: (id: number, title: string) =>
      ipcRenderer.invoke('entries:updateTitle', id, title),
    toggleBookmark: (id: number) => ipcRenderer.invoke('entries:toggleBookmark', id),
    getAllBookmarked: () => ipcRenderer.invoke('entries:getAllBookmarked')
  },
  entryWritings: {
    getWritingsForEntry: (entryId: number) =>
      ipcRenderer.invoke('entryWritings:getWritingsForEntry', entryId),
    updateWritingContent: (writingId: number, newContent: string) =>
      ipcRenderer.invoke('entryWritings:updateWritingContent', writingId, newContent)
  },
  entryWidgets: {
    getWidgetsForEntry: (entryId: number) =>
      ipcRenderer.invoke('entryWidgets:getWidgetsForEntry', entryId)
  },
  todos: {
    createTodo: (entryDate: string, label: string) =>
      ipcRenderer.invoke('todos:createTodo', entryDate, label),
    getTodosForDate: (entryDate: string) => ipcRenderer.invoke('todos:getTodosForDate', entryDate),
    toggleTodoCompleted: (todoId: number) =>
      ipcRenderer.invoke('todos:toggleTodoCompleted', todoId),
    deleteTodo: (todoId: number) => ipcRenderer.invoke('todos:deleteTodo', todoId),
    updateTodoLabel: (todoId: number, newLabel: string) =>
      ipcRenderer.invoke('todos:updateTodoLabel', todoId, newLabel),
    changeTodoPosition: (todoId: number, newPosition: number) =>
      ipcRenderer.invoke('todos:changeTodoPosition', todoId, newPosition)
  },
  moodTags: {
    getAllMoodTags: () => ipcRenderer.invoke('moodTags:getAllMoodTags'),
    getMoodTagsForEntry: (entryId: number) =>
      ipcRenderer.invoke('moodTags:getMoodTagsForEntry', entryId),
    addMoodTagToEntry: (entryId: number, tagId: number) =>
      ipcRenderer.invoke('moodTags:addMoodTagToEntry', entryId, tagId),
    removeMoodTagFromEntry: (entryId: number, tagId: number) =>
      ipcRenderer.invoke('moodTags:removeMoodTagFromEntry', entryId, tagId),
    removeMoodTag: (tagId: number) => ipcRenderer.invoke('moodTags:removeMoodTag', tagId),
    createMoodTag: (label: string) => ipcRenderer.invoke('moodTags:createMoodTag', label)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
