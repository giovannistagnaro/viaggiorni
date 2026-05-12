import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Template from './Template'
import type { TemplateWidget, TemplateWriting } from '@shared/types'
import {
  WIDGET_TYPES,
  WIDGET_TYPE_LABELS,
  WRITING_TYPES,
  WRITING_TYPE_LABELS
} from '@shared/constants'

const TEMPLATE_ID = 1

const widget = (overrides: Partial<TemplateWidget> = {}): TemplateWidget => ({
  id: 100,
  templateId: TEMPLATE_ID,
  type: 'mood_tracker',
  position: 0,
  colSpan: 2,
  isVisible: true,
  createdAt: '2026-05-01 00:00:00',
  ...overrides
})

const writing = (overrides: Partial<TemplateWriting> = {}): TemplateWriting => ({
  id: 200,
  templateId: TEMPLATE_ID,
  type: 'daily_summary',
  label: 'Daily Summary',
  position: 0,
  isVisible: true,
  createdAt: '2026-05-01 00:00:00',
  ...overrides
})

beforeEach(() => {
  window.api = {
    template: {
      getActiveTemplate: vi.fn().mockResolvedValue({
        id: TEMPLATE_ID,
        widgets: [
          widget({ id: 101, type: 'mood_tracker', position: 0 }),
          widget({ id: 102, type: 'habit_tracker', position: 1 })
        ],
        writings: [
          writing({ id: 201, type: 'daily_summary', position: 0 }),
          writing({ id: 202, type: 'gratitude', position: 1 })
        ]
      }),
      addTemplateWriting: vi.fn(),
      removeTemplateWriting: vi.fn(),
      updateTemplateWriting: vi.fn(),
      changeTemplateWritingPosition: vi.fn(),
      addTemplateWidget: vi.fn(),
      removeTemplateWidget: vi.fn(),
      updateTemplateWidget: vi.fn(),
      changeTemplateWidgetPosition: vi.fn()
    }
  } as never
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Template', () => {
  describe('initial render', () => {
    it('fetches the active template on mount', async () => {
      render(<Template />)

      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalled()
      })
    })

    it('renders the seeded widgets and writings', async () => {
      render(<Template />)

      await screen.findByText(WIDGET_TYPE_LABELS.mood_tracker)
      expect(screen.getByText(WIDGET_TYPE_LABELS.habit_tracker)).toBeInTheDocument()
      expect(screen.getByText(WRITING_TYPE_LABELS.daily_summary)).toBeInTheDocument()
      expect(screen.getByText(WRITING_TYPE_LABELS.gratitude)).toBeInTheDocument()
    })
  })

  describe('removing items', () => {
    it('calls removeTemplateWidget with the widget id and refreshes', async () => {
      render(<Template />)
      const deleteBtn = await screen.findByRole('button', { name: 'Remove mood_tracker' })
      await userEvent.click(deleteBtn)

      expect(window.api.template.removeTemplateWidget).toHaveBeenCalledWith(101)
      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalledTimes(2)
      })
    })

    it('calls removeTemplateWriting with the writing id and refreshes', async () => {
      render(<Template />)
      const deleteBtn = await screen.findByRole('button', { name: 'Remove daily_summary' })
      await userEvent.click(deleteBtn)

      expect(window.api.template.removeTemplateWriting).toHaveBeenCalledWith(201)
      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('reordering items', () => {
    it('calls changeTemplateWidgetPosition with position - 1 when Up is clicked', async () => {
      render(<Template />)
      const upBtn = await screen.findByRole('button', { name: 'Move habit_tracker up' })
      await userEvent.click(upBtn)

      // habit_tracker is at position 1, moving up = 0
      expect(window.api.template.changeTemplateWidgetPosition).toHaveBeenCalledWith(102, 0)
    })

    it('calls changeTemplateWritingPosition with position + 1 when Down is clicked', async () => {
      render(<Template />)
      const downBtn = await screen.findByRole('button', { name: 'Move daily_summary down' })
      await userEvent.click(downBtn)

      // daily_summary is at position 0, moving down = 1
      expect(window.api.template.changeTemplateWritingPosition).toHaveBeenCalledWith(201, 1)
    })
  })

  describe('add dropdown', () => {
    it('only lists widget types not already present', async () => {
      render(<Template />)
      await screen.findByText(WIDGET_TYPE_LABELS.mood_tracker)

      const widgetSelect = screen.getByLabelText('Add widget') as HTMLSelectElement
      const optionValues = Array.from(widgetSelect.querySelectorAll('option')).map((o) => o.value)

      // Placeholder option has empty value; real options should exclude the present types
      expect(optionValues).toContain('')
      expect(optionValues).not.toContain('mood_tracker')
      expect(optionValues).not.toContain('habit_tracker')
      const expectedAvailable = WIDGET_TYPES.filter(
        (t) => t !== 'mood_tracker' && t !== 'habit_tracker'
      )
      expectedAvailable.forEach((t) => expect(optionValues).toContain(t))
    })

    it('calls addTemplateWidget with the template id and selected type', async () => {
      render(<Template />)
      await screen.findByText(WIDGET_TYPE_LABELS.mood_tracker)

      const widgetSelect = screen.getByLabelText('Add widget') as HTMLSelectElement
      await userEvent.selectOptions(widgetSelect, 'todo_list')

      expect(window.api.template.addTemplateWidget).toHaveBeenCalledWith(TEMPLATE_ID, 'todo_list')
      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalledTimes(2)
      })
    })

    it('calls addTemplateWriting with template id, type, and the default label for the type', async () => {
      render(<Template />)
      await screen.findByText(WRITING_TYPE_LABELS.daily_summary)

      const writingSelect = screen.getByLabelText('Add writing') as HTMLSelectElement
      await userEvent.selectOptions(writingSelect, 'notable_moment')

      expect(window.api.template.addTemplateWriting).toHaveBeenCalledWith(
        TEMPLATE_ID,
        'notable_moment',
        WRITING_TYPE_LABELS.notable_moment
      )
    })

    it('hides the widget add dropdown when all widget types are present', async () => {
      vi.mocked(window.api.template.getActiveTemplate).mockResolvedValue({
        id: TEMPLATE_ID,
        widgets: WIDGET_TYPES.map((type, i) => widget({ id: 100 + i, type, position: i })),
        writings: []
      })

      render(<Template />)
      await screen.findByText(WIDGET_TYPE_LABELS[WIDGET_TYPES[0]])

      expect(screen.queryByLabelText('Add widget')).not.toBeInTheDocument()
    })

    it('hides the writing add dropdown when all selectable writing types are present', async () => {
      const selectableTypes = WRITING_TYPES.filter((t) => t !== 'custom')
      vi.mocked(window.api.template.getActiveTemplate).mockResolvedValue({
        id: TEMPLATE_ID,
        widgets: [],
        writings: selectableTypes.map((type, i) => writing({ id: 200 + i, type, position: i }))
      })

      render(<Template />)
      await screen.findByText(WRITING_TYPE_LABELS[selectableTypes[0]])

      expect(screen.queryByLabelText('Add writing')).not.toBeInTheDocument()
    })

    it('does not list "custom" in the writings dropdown', async () => {
      render(<Template />)
      await screen.findByText(WRITING_TYPE_LABELS.daily_summary)

      const writingSelect = screen.getByLabelText('Add writing') as HTMLSelectElement
      const optionValues = Array.from(writingSelect.querySelectorAll('option')).map((o) => o.value)
      expect(optionValues).not.toContain('custom')
    })
  })

  describe('widget colSpan picker', () => {
    it('renders a colSpan select per widget initialized to widget.colSpan', async () => {
      render(<Template />)
      await screen.findByText(WIDGET_TYPE_LABELS.mood_tracker)

      const colSpanSelect = screen.getByLabelText('mood_tracker width') as HTMLSelectElement
      expect(colSpanSelect.value).toBe('2')
    })

    it('calls updateTemplateWidget with the new colSpan and existing isVisible when changed', async () => {
      render(<Template />)
      await screen.findByText(WIDGET_TYPE_LABELS.mood_tracker)

      const colSpanSelect = screen.getByLabelText('mood_tracker width') as HTMLSelectElement
      await userEvent.selectOptions(colSpanSelect, '4')

      expect(window.api.template.updateTemplateWidget).toHaveBeenCalledWith(101, 4, true)
    })
  })
})
