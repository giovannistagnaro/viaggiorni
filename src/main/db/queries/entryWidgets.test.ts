import { DrizzleDB } from '../database'
import { closeTestDb, createTestDb } from './testHelper'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { createEntry } from './entries'
import {
  addEntryWidget,
  changeEntryWidgetPosition,
  getWidgetsForEntry,
  setEntryWidgetVisibility
} from './entryWidgets'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getWidgetsForEntry', () => {
  it('returns empty array when no entryId matches', () => {
    const matchingWidgets = getWidgetsForEntry(db, 999)

    expect(matchingWidgets).toEqual([])
  })

  it('returns only widgets for the specific entry', () => {
    createEntry(db, '2026-05-01', 'Entry 1')
    const entry2 = createEntry(db, '2026-05-02', 'Entry 2')
    createEntry(db, '2026-05-03', 'Entry 2')

    const matchingWidgets = getWidgetsForEntry(db, entry2.id)

    expect(matchingWidgets.length).toBeGreaterThan(0)
    expect(matchingWidgets.every((widget) => widget.entryId === entry2.id)).toBe(true)
  })

  it('orders widgets by position ascending', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const matchingWidgets = getWidgetsForEntry(db, entry.id)

    expect(matchingWidgets.length).toBeGreaterThan(0)
    expect(matchingWidgets.map((widget) => widget.position)).toEqual(
      matchingWidgets.map((widget) => widget.position).sort((a, b) => a - b)
    )
  })
})

describe('setEntryWidgetVisibility', () => {
  it('sets isVisible to false', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widget = getWidgetsForEntry(db, entry.id)[0]

    setEntryWidgetVisibility(db, widget.id, false)

    const updated = getWidgetsForEntry(db, entry.id).find((w) => w.id === widget.id)
    expect(updated?.isVisible).toBe(false)
  })

  it('sets isVisible back to true', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widget = getWidgetsForEntry(db, entry.id)[0]
    setEntryWidgetVisibility(db, widget.id, false)

    setEntryWidgetVisibility(db, widget.id, true)

    const updated = getWidgetsForEntry(db, entry.id).find((w) => w.id === widget.id)
    expect(updated?.isVisible).toBe(true)
  })

  it('throws when the widget does not exist', () => {
    expect(() => setEntryWidgetVisibility(db, 999, false)).toThrow(/Entry widget not found/i)
  })
})

describe('changeEntryWidgetPosition', () => {
  it('moves a widget to a higher position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widgets = getWidgetsForEntry(db, entry.id)
    const target = widgets[0]

    changeEntryWidgetPosition(db, target.id, widgets.length - 1)

    const after = getWidgetsForEntry(db, entry.id)
    expect(after.find((w) => w.id === target.id)?.position).toBe(widgets.length - 1)
  })

  it('moves a widget to a lower position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widgets = getWidgetsForEntry(db, entry.id)
    const target = widgets[widgets.length - 1]

    changeEntryWidgetPosition(db, target.id, 0)

    const after = getWidgetsForEntry(db, entry.id)
    expect(after.find((w) => w.id === target.id)?.position).toBe(0)
  })

  it('does nothing when newPosition equals the current position', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widgets = getWidgetsForEntry(db, entry.id)
    const before = widgets.map((w) => ({ id: w.id, position: w.position }))

    changeEntryWidgetPosition(db, widgets[0].id, widgets[0].position)

    const after = getWidgetsForEntry(db, entry.id).map((w) => ({ id: w.id, position: w.position }))
    expect(after).toEqual(before)
  })

  it('clamps newPosition higher than max to the end', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widgets = getWidgetsForEntry(db, entry.id)

    changeEntryWidgetPosition(db, widgets[0].id, 999)

    const after = getWidgetsForEntry(db, entry.id)
    expect(after.find((w) => w.id === widgets[0].id)?.position).toBe(widgets.length - 1)
  })

  it('clamps negative newPosition to the start', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widgets = getWidgetsForEntry(db, entry.id)
    const target = widgets[widgets.length - 1]

    changeEntryWidgetPosition(db, target.id, -5)

    const after = getWidgetsForEntry(db, entry.id)
    expect(after.find((w) => w.id === target.id)?.position).toBe(0)
  })

  it('preserves contiguous positions across the entry after a move', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const widgets = getWidgetsForEntry(db, entry.id)

    changeEntryWidgetPosition(db, widgets[0].id, widgets.length - 1)

    const after = getWidgetsForEntry(db, entry.id)
    const positions = after.map((w) => w.position).sort((a, b) => a - b)
    expect(positions).toEqual(Array.from({ length: widgets.length }, (_, i) => i))
  })

  it('throws when the widget does not exist', () => {
    expect(() => changeEntryWidgetPosition(db, 999, 0)).toThrow(/Entry widget not found/i)
  })

  it('does not affect widgets in other entries', () => {
    const e1 = createEntry(db, '2026-05-01', 'Entry 1')
    const e2 = createEntry(db, '2026-05-02', 'Entry 2')
    const e2Before = getWidgetsForEntry(db, e2.id).map((w) => ({ id: w.id, position: w.position }))

    const e1Widget = getWidgetsForEntry(db, e1.id)[0]
    changeEntryWidgetPosition(db, e1Widget.id, 999)

    const e2After = getWidgetsForEntry(db, e2.id).map((w) => ({ id: w.id, position: w.position }))
    expect(e2After).toEqual(e2Before)
  })
})

describe('addEntryWidget', () => {
  it('inserts a widget at the end of the entry', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')
    const beforeCount = getWidgetsForEntry(db, entry.id).length

    addEntryWidget(db, entry.id, 'photo')

    const after = getWidgetsForEntry(db, entry.id)
    expect(after.length).toBe(beforeCount + 1)
    expect(after[after.length - 1].type).toBe('photo')
    expect(after[after.length - 1].position).toBe(beforeCount)
  })

  it('returns the inserted row with isVisible true and default colSpan of 2', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const inserted = addEntryWidget(db, entry.id, 'photo')

    expect(inserted.entryId).toBe(entry.id)
    expect(inserted.type).toBe('photo')
    expect(inserted.isVisible).toBe(true)
    expect(inserted.colSpan).toBe(2)
  })

  it('respects an explicit colSpan when provided', () => {
    const entry = createEntry(db, '2026-05-01', 'Entry 1')

    const inserted = addEntryWidget(db, entry.id, 'photo', 4)

    expect(inserted.colSpan).toBe(4)
  })

  it('throws when the entryId does not exist', () => {
    expect(() => addEntryWidget(db, 999, 'photo')).toThrow(/Entry not found/i)
  })
})
