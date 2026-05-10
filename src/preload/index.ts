import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Theme } from '@shared/types'

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
    getAllBookmarked: () => ipcRenderer.invoke('entries:getAllBookmarked'),
    getAllDates: () => ipcRenderer.invoke('entries:getAllDates')
  },
  entryWritings: {
    getWritingsForEntry: (entryId: number) =>
      ipcRenderer.invoke('entryWritings:getWritingsForEntry', entryId),
    updateWritingContent: (writingId: number, newContent: string) =>
      ipcRenderer.invoke('entryWritings:updateWritingContent', writingId, newContent),
    updateWritingPrompt: (writingId: number, newPrompt: string) =>
      ipcRenderer.invoke('entryWritings:updateWritingPrompt', writingId, newPrompt),
    getOrCreatePromptForWriting: (writingId: number, entryDate: string) =>
      ipcRenderer.invoke('entryWritings:getOrCreatePromptForWriting', writingId, entryDate),
    setVisibility: (writingId: number, isVisible: boolean) =>
      ipcRenderer.invoke('entryWritings:setVisibility', writingId, isVisible),
    changePosition: (writingId: number, newPosition: number) =>
      ipcRenderer.invoke('entryWritings:changePosition', writingId, newPosition),
    addEntryWriting: (entryId: number, type: string, label: string | null) =>
      ipcRenderer.invoke('entryWritings:addEntryWriting', entryId, type, label)
  },
  entryWidgets: {
    getWidgetsForEntry: (entryId: number) =>
      ipcRenderer.invoke('entryWidgets:getWidgetsForEntry', entryId),
    setVisibility: (widgetId: number, isVisible: boolean) =>
      ipcRenderer.invoke('entryWidgets:setVisibility', widgetId, isVisible),
    changePosition: (widgetId: number, newPosition: number) =>
      ipcRenderer.invoke('entryWidgets:changePosition', widgetId, newPosition),
    addEntryWidget: (entryId: number, type: string, colSpan?: number) =>
      ipcRenderer.invoke('entryWidgets:addEntryWidget', entryId, type, colSpan),
    updateColSpan: (widgetId: number, colSpan: number) =>
      ipcRenderer.invoke('entryWidgets:updateColSpan', widgetId, colSpan)
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
  },
  habit: {
    getActiveHabits: () => ipcRenderer.invoke('habit:getActiveHabits'),
    createHabit: (name: string, color: string) =>
      ipcRenderer.invoke('habit:createHabit', name, color),
    archiveHabit: (habitId: number) => ipcRenderer.invoke('habit:archiveHabit', habitId),
    unarchiveHabit: (habitId: number) => ipcRenderer.invoke('habit:unarchiveHabit', habitId),
    updateHabit: (habitId: number, name: string, color: string) =>
      ipcRenderer.invoke('habit:updateHabit', habitId, name, color),
    getHabitLogForDate: (habitId: number, date: string) =>
      ipcRenderer.invoke('habit:getHabitLogForDate', habitId, date),
    toggleHabitCompleted: (habitId: number, date: string) =>
      ipcRenderer.invoke('habit:toggleHabitCompleted', habitId, date),
    pauseHabit: (habitId: number, startDate: string) =>
      ipcRenderer.invoke('habit:pauseHabit', habitId, startDate),
    resumeHabit: (habitId: number, endDate: string) =>
      ipcRenderer.invoke('habit:resumeHabit', habitId, endDate),
    calculateStreak: (habitId: number, today: string, tolerance: number) =>
      ipcRenderer.invoke('habit:calculateStreak', habitId, today, tolerance)
  },
  wordOfDay: {
    getOrCreateForDate: (date: string) => ipcRenderer.invoke('wordOfDay:getOrCreateForDate', date)
  },
  entryPhotos: {
    createPhoto: (entryId: number) => ipcRenderer.invoke('entryPhotos:createPhoto', entryId),
    getPhotosForEntry: (entryId: number) =>
      ipcRenderer.invoke('entryPhotos:getPhotosForEntry', entryId),
    getPhotoById: (photoId: number) => ipcRenderer.invoke('entryPhotos:getPhotoById', photoId),
    deletePhoto: (photoId: number) => ipcRenderer.invoke('entryPhotos:deletePhoto', photoId),
    updatePhotoCaption: (photoId: number, newCaption: string) =>
      ipcRenderer.invoke('entryPhotos:updatePhotoCaption', photoId, newCaption),
    changePhotoPosition: (photoId: number, newPosition: number) =>
      ipcRenderer.invoke('entryPhotos:changePhotoPosition', photoId, newPosition)
  },
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:getSettings'),
    updateTheme: (theme: Theme) => ipcRenderer.invoke('settings:updateTheme', theme),
    updateStreakTolerance: (tolerance: number) =>
      ipcRenderer.invoke('settings:updateStreakTolerance', tolerance),
    updateOllamaModel: (model: string | null) =>
      ipcRenderer.invoke('settings:updateOllamaModel', model)
  },
  ollama: {
    listOllamaModels: () => ipcRenderer.invoke('ollama:listOllamaModels'),
    isOllamaAvailable: () => ipcRenderer.invoke('ollama:isOllamaAvailable')
  },
  template: {
    getActiveTemplate: () => ipcRenderer.invoke('template:getActiveTemplate'),
    addTemplateWriting: (templateId: number, type: string, label: string | null) =>
      ipcRenderer.invoke('template:addTemplateWriting', templateId, type, label),
    removeTemplateWriting: (writingId: number) =>
      ipcRenderer.invoke('template:removeTemplateWriting', writingId),
    updateTemplateWriting: (writingId: number, label: string | null, isVisible: boolean) =>
      ipcRenderer.invoke('template:updateTemplateWriting', writingId, label, isVisible),
    changeTemplateWritingPosition: (writingId: number, newPosition: number) =>
      ipcRenderer.invoke('template:changeTemplateWritingPosition', writingId, newPosition),
    addTemplateWidget: (templateId: number, type: string, colSpan?: number) =>
      ipcRenderer.invoke('template:addTemplateWidget', templateId, type, colSpan),
    removeTemplateWidget: (widgetId: number) =>
      ipcRenderer.invoke('template:removeTemplateWidget', widgetId),
    updateTemplateWidget: (widgetId: number, colSpan: number, isVisible: boolean) =>
      ipcRenderer.invoke('template:updateTemplateWidget', widgetId, colSpan, isVisible),
    changeTemplateWidgetPosition: (widgetId: number, newPosition: number) =>
      ipcRenderer.invoke('template:changeTemplateWidgetPosition', widgetId, newPosition)
  },
  backup: {
    exportBackup: () => ipcRenderer.invoke('backup:exportBackup'),
    importBackup: () => ipcRenderer.invoke('backup:importBackup')
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
