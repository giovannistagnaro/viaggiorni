import { ipcMain } from 'electron'
import log from 'electron-log'
import {
  addTemplateWidget,
  addTemplateWriting,
  changeTemplateWidgetPosition,
  changeTemplateWritingPosition,
  getActiveTemplate,
  removeTemplateWidget,
  removeTemplateWriting,
  updateTemplateWidget,
  updateTemplateWriting
} from '../db/queries/template'
import { getDB } from '../db'
import { WidgetType, WritingType } from '@shared/types'

export function registerTemplateIpc(): void {
  ipcMain.handle('template:getActiveTemplate', () => {
    try {
      return getActiveTemplate(getDB())
    } catch (err) {
      log.error('Failed to get active template', { error: err })
      throw err
    }
  })

  ipcMain.handle(
    'template:addTemplateWriting',
    (_event, templateId: number, type: WritingType, label: string | null) => {
      try {
        return addTemplateWriting(getDB(), templateId, type, label)
      } catch (err) {
        log.error('Failed to add template writing', { templateId, type, error: err })
        throw err
      }
    }
  )

  ipcMain.handle('template:removeTemplateWriting', (_event, writingId: number) => {
    try {
      removeTemplateWriting(getDB(), writingId)
    } catch (err) {
      log.error('Failed to remove template writing', { writingId, error: err })
      throw err
    }
  })

  ipcMain.handle(
    'template:updateTemplateWriting',
    (_event, writingId: number, label: string | null, isVisible: boolean) => {
      try {
        updateTemplateWriting(getDB(), writingId, label, isVisible)
      } catch (err) {
        log.error('Failed to update template writing', { writingId, error: err })
        throw err
      }
    }
  )

  ipcMain.handle(
    'template:changeTemplateWritingPosition',
    (_event, writingId: number, newPosition: number) => {
      try {
        changeTemplateWritingPosition(getDB(), writingId, newPosition)
      } catch (err) {
        log.error('Failed to change template writing position', { writingId, error: err })
        throw err
      }
    }
  )

  ipcMain.handle(
    'template:addTemplateWidget',
    (_event, templateId: number, type: WidgetType, colSpan?: number) => {
      try {
        return addTemplateWidget(getDB(), templateId, type, colSpan)
      } catch (err) {
        log.error('Failed to add template widget', { templateId, type, error: err })
        throw err
      }
    }
  )

  ipcMain.handle('template:removeTemplateWidget', (_event, widgetId: number) => {
    try {
      removeTemplateWidget(getDB(), widgetId)
    } catch (err) {
      log.error('Failed to remove template widget', { widgetId, error: err })
      throw err
    }
  })

  ipcMain.handle(
    'template:updateTemplateWidget',
    (_event, widgetId: number, colSpan: number, isVisible: boolean) => {
      try {
        updateTemplateWidget(getDB(), widgetId, colSpan, isVisible)
      } catch (err) {
        log.error('Failed to update template widget', { widgetId, error: err })
        throw err
      }
    }
  )

  ipcMain.handle(
    'template:changeTemplateWidgetPosition',
    (_event, widgetId: number, newPosition: number) => {
      try {
        changeTemplateWidgetPosition(getDB(), widgetId, newPosition)
      } catch (err) {
        log.error('Failed to change template widget position', { widgetId, error: err })
        throw err
      }
    }
  )
}
