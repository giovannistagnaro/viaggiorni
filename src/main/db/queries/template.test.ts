import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
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
} from './template'
import { template, templateWidgets, templateWritings } from '../schemas/schema'
import type { DrizzleDB } from '../database'
import { eq } from 'drizzle-orm'

let db: DrizzleDB
let templateId: number

// helper — fetch the seeded template's id (singleton)
function getTemplateId(): number {
  const row = db.select({ id: template.id }).from(template).get()
  if (!row) throw new Error('Test setup: no template')
  return row.id
}

beforeEach(() => {
  db = createTestDb()
  templateId = getTemplateId()
})

afterEach(() => {
  closeTestDb(db)
})

describe('getActiveTemplate', () => {
  it('returns the seeded writings ordered by position', () => {
    const { writings } = getActiveTemplate(db)

    expect(writings.length).toBeGreaterThan(0)
    expect(writings.map((w) => w.position)).toEqual(
      [...writings.map((w) => w.position)].sort((a, b) => a - b)
    )
  })

  it('returns the seeded widgets ordered by position', () => {
    const { widgets } = getActiveTemplate(db)

    expect(widgets.length).toBeGreaterThan(0)
    expect(widgets.map((w) => w.position)).toEqual(
      [...widgets.map((w) => w.position)].sort((a, b) => a - b)
    )
  })

  it('throws when no template exists', () => {
    db.delete(templateWritings).run()
    db.delete(templateWidgets).run()
    db.delete(template).run()

    expect(() => getActiveTemplate(db)).toThrow(/Template not found/i)
  })
})

describe('addTemplateWriting', () => {
  it('returns the inserted row', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', 'My Section')

    expect(inserted.id).toBeGreaterThan(0)
    expect(inserted.type).toBe('custom')
    expect(inserted.label).toBe('My Section')
    expect(inserted.isVisible).toBe(true)
  })

  it('appends to the end of the writings list', () => {
    const before = getActiveTemplate(db).writings
    const maxBefore = Math.max(...before.map((w) => w.position))

    const inserted = addTemplateWriting(db, templateId, 'custom', 'New')

    expect(inserted.position).toBe(maxBefore + 1)
  })

  it('accepts a null label', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', null)

    expect(inserted.label).toBeNull()
  })

  it('stamps updatedAt on the template', () => {
    addTemplateWriting(db, templateId, 'custom', 'X')

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the templateId does not exist', () => {
    expect(() => addTemplateWriting(db, 999, 'custom', 'X')).toThrow(/Template not found/i)
  })
})

describe('removeTemplateWriting', () => {
  it('removes the row from the database', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', 'To delete')

    removeTemplateWriting(db, inserted.id)

    const row = db.select().from(templateWritings).where(eq(templateWritings.id, inserted.id)).get()
    expect(row).toBeUndefined()
  })

  it('shifts the positions of subsequent writings down by 1', () => {
    const fourth = addTemplateWriting(db, templateId, 'custom', 'Fourth')
    expect(fourth.position).toBe(3)

    const before = getActiveTemplate(db).writings
    const target = before.find((w) => w.position === 1)!

    removeTemplateWriting(db, target.id)

    const after = getActiveTemplate(db).writings
    expect(after.map((w) => w.position).sort((a, b) => a - b)).toEqual([0, 1, 2])
  })

  it('stamps updatedAt on the template', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', 'X')
    db.update(template).set({ updatedAt: null }).where(eq(template.id, templateId)).run()

    removeTemplateWriting(db, inserted.id)

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the writing does not exist', () => {
    expect(() => removeTemplateWriting(db, 999)).toThrow(/Template writing not found/i)
  })
})

describe('updateTemplateWriting', () => {
  it('updates the label and isVisible fields', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', 'Old')

    updateTemplateWriting(db, inserted.id, 'New label', false)

    const row = db.select().from(templateWritings).where(eq(templateWritings.id, inserted.id)).get()
    expect(row?.label).toBe('New label')
    expect(row?.isVisible).toBe(false)
  })

  it('allows clearing the label by passing null', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', 'Has label')

    updateTemplateWriting(db, inserted.id, null, true)

    const row = db.select().from(templateWritings).where(eq(templateWritings.id, inserted.id)).get()
    expect(row?.label).toBeNull()
  })

  it('stamps updatedAt on the template', () => {
    const inserted = addTemplateWriting(db, templateId, 'custom', 'X')
    db.update(template).set({ updatedAt: null }).where(eq(template.id, templateId)).run()

    updateTemplateWriting(db, inserted.id, 'New', true)

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the writing does not exist', () => {
    expect(() => updateTemplateWriting(db, 999, 'X', true)).toThrow(/Template writing not found/i)
  })
})

describe('changeTemplateWritingPosition', () => {
  it('moves a writing to a higher position', () => {
    const writings = getActiveTemplate(db).writings
    const first = writings[0]

    changeTemplateWritingPosition(db, first.id, 2)

    const after = getActiveTemplate(db).writings
    expect(after[after.length - 1].id).toBe(first.id)
  })

  it('moves a writing to a lower position', () => {
    const writings = getActiveTemplate(db).writings
    const last = writings[writings.length - 1]

    changeTemplateWritingPosition(db, last.id, 0)

    const after = getActiveTemplate(db).writings
    expect(after[0].id).toBe(last.id)
  })

  it('does nothing when newPosition equals the current position', () => {
    const writings = getActiveTemplate(db).writings
    const middle = writings[1]

    changeTemplateWritingPosition(db, middle.id, 1)

    const after = getActiveTemplate(db).writings
    expect(after[1].id).toBe(middle.id)
  })

  it('clamps newPosition higher than max to the end', () => {
    const writings = getActiveTemplate(db).writings
    const first = writings[0]

    changeTemplateWritingPosition(db, first.id, 999)

    const after = getActiveTemplate(db).writings
    expect(after[after.length - 1].id).toBe(first.id)
  })

  it('clamps negative newPosition to the start', () => {
    const writings = getActiveTemplate(db).writings
    const last = writings[writings.length - 1]

    changeTemplateWritingPosition(db, last.id, -5)

    const after = getActiveTemplate(db).writings
    expect(after[0].id).toBe(last.id)
  })

  it('preserves the total count of writings', () => {
    const beforeCount = getActiveTemplate(db).writings.length
    const writings = getActiveTemplate(db).writings

    changeTemplateWritingPosition(db, writings[0].id, 2)

    expect(getActiveTemplate(db).writings.length).toBe(beforeCount)
  })

  it('stamps updatedAt on the template', () => {
    db.update(template).set({ updatedAt: null }).where(eq(template.id, templateId)).run()
    const writings = getActiveTemplate(db).writings

    changeTemplateWritingPosition(db, writings[0].id, 2)

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the writing does not exist', () => {
    expect(() => changeTemplateWritingPosition(db, 999, 0)).toThrow(/Template writing not found/i)
  })
})

describe('addTemplateWidget', () => {
  it('returns the inserted row with default colSpan of 2', () => {
    const inserted = addTemplateWidget(db, templateId, 'photo')

    expect(inserted.type).toBe('photo')
    expect(inserted.colSpan).toBe(2)
    expect(inserted.isVisible).toBe(true)
  })

  it('respects an explicit colSpan when provided', () => {
    const inserted = addTemplateWidget(db, templateId, 'photo', 1)

    expect(inserted.colSpan).toBe(1)
  })

  it('appends to the end of the widgets list', () => {
    const before = getActiveTemplate(db).widgets
    const maxBefore = Math.max(...before.map((w) => w.position))

    const inserted = addTemplateWidget(db, templateId, 'photo')

    expect(inserted.position).toBe(maxBefore + 1)
  })

  it('stamps updatedAt on the template', () => {
    addTemplateWidget(db, templateId, 'photo')

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the templateId does not exist', () => {
    expect(() => addTemplateWidget(db, 999, 'photo')).toThrow(/Template not found/i)
  })
})

describe('removeTemplateWidget', () => {
  it('removes the row from the database', () => {
    const inserted = addTemplateWidget(db, templateId, 'photo')

    removeTemplateWidget(db, inserted.id)

    const row = db.select().from(templateWidgets).where(eq(templateWidgets.id, inserted.id)).get()
    expect(row).toBeUndefined()
  })

  it('shifts the positions of subsequent widgets down by 1', () => {
    addTemplateWidget(db, templateId, 'photo') // appended at position 3
    const before = getActiveTemplate(db).widgets
    const target = before.find((w) => w.position === 1)!

    removeTemplateWidget(db, target.id)

    const after = getActiveTemplate(db).widgets
    expect(after.map((w) => w.position).sort((a, b) => a - b)).toEqual([0, 1, 2])
  })

  it('stamps updatedAt on the template', () => {
    const inserted = addTemplateWidget(db, templateId, 'photo')
    db.update(template).set({ updatedAt: null }).where(eq(template.id, templateId)).run()

    removeTemplateWidget(db, inserted.id)

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the widget does not exist', () => {
    expect(() => removeTemplateWidget(db, 999)).toThrow(/Template widget not found/i)
  })
})

describe('updateTemplateWidget', () => {
  it('updates colSpan and isVisible', () => {
    const inserted = addTemplateWidget(db, templateId, 'photo', 2)

    updateTemplateWidget(db, inserted.id, 1, false)

    const row = db.select().from(templateWidgets).where(eq(templateWidgets.id, inserted.id)).get()
    expect(row?.colSpan).toBe(1)
    expect(row?.isVisible).toBe(false)
  })

  it('stamps updatedAt on the template', () => {
    const inserted = addTemplateWidget(db, templateId, 'photo')
    db.update(template).set({ updatedAt: null }).where(eq(template.id, templateId)).run()

    updateTemplateWidget(db, inserted.id, 1, true)

    const row = db.select().from(template).where(eq(template.id, templateId)).get()
    expect(row?.updatedAt).not.toBeNull()
  })

  it('throws when the widget does not exist', () => {
    expect(() => updateTemplateWidget(db, 999, 1, true)).toThrow(/Template widget not found/i)
  })
})

describe('changeTemplateWidgetPosition', () => {
  it('moves a widget to a higher position', () => {
    const widgets = getActiveTemplate(db).widgets
    const first = widgets[0]

    changeTemplateWidgetPosition(db, first.id, 2)

    const after = getActiveTemplate(db).widgets
    expect(after[after.length - 1].id).toBe(first.id)
  })

  it('moves a widget to a lower position', () => {
    const widgets = getActiveTemplate(db).widgets
    const last = widgets[widgets.length - 1]

    changeTemplateWidgetPosition(db, last.id, 0)

    const after = getActiveTemplate(db).widgets
    expect(after[0].id).toBe(last.id)
  })

  it('clamps newPosition higher than max to the end', () => {
    const widgets = getActiveTemplate(db).widgets
    const first = widgets[0]

    changeTemplateWidgetPosition(db, first.id, 999)

    const after = getActiveTemplate(db).widgets
    expect(after[after.length - 1].id).toBe(first.id)
  })

  it('clamps negative newPosition to the start', () => {
    const widgets = getActiveTemplate(db).widgets
    const last = widgets[widgets.length - 1]

    changeTemplateWidgetPosition(db, last.id, -5)

    const after = getActiveTemplate(db).widgets
    expect(after[0].id).toBe(last.id)
  })

  it('throws when the widget does not exist', () => {
    expect(() => changeTemplateWidgetPosition(db, 999, 0)).toThrow(/Template widget not found/i)
  })
})
