import { ipcMain } from 'electron'
import {
  addEntryWidget,
  changeEntryWidgetPosition,
  getWidgetsForEntry,
  setEntryWidgetVisibility
} from '../db/queries/entryWidgets'
import { getDB } from '../db'
import log from 'electron-log'
import { WidgetType } from '@shared/types'

export function registerEntryWidgetsIpc(): void {
  ipcMain.handle('entryWidgets:getWidgetsForEntry', (_, entryId: number) => {
    try {
      return getWidgetsForEntry(getDB(), entryId)
    } catch (err) {
      log.error('Failed to find matching entry for widgets', { entryId, error: err })
      throw err
    }
  })

  ipcMain.handle('entryWidgets:setVisibility', (_, widgetId: number, isVisible: boolean) => {
    try {
      setEntryWidgetVisibility(getDB(), widgetId, isVisible)
    } catch (err) {
      log.error('Failed to set entry widget visibility', { widgetId, isVisible, error: err })
      throw err
    }
  })

  ipcMain.handle('entryWidgets:changePosition', (_, widgetId: number, newPosition: number) => {
    try {
      changeEntryWidgetPosition(getDB(), widgetId, newPosition)
    } catch (err) {
      log.error('Failed to change entry widget position', { widgetId, newPosition, error: err })
      throw err
    }
  })

  ipcMain.handle(
    'entryWidgets:addEntryWidget',
    (_, entryId: number, type: WidgetType, colSpan?: number) => {
      try {
        return addEntryWidget(getDB(), entryId, type, colSpan)
      } catch (err) {
        log.error('Failed to add entry widget', { entryId, type, error: err })
        throw err
      }
    }
  )
}
