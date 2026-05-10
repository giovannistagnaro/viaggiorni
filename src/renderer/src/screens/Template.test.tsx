import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Template from './Template'
import type { TemplateWidget, TemplateWriting } from '@shared/types'
import { WIDGET_TYPES, WRITING_TYPES, WRITING_TYPE_LABELS } from '@shared/constants'

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

      await screen.findByText('mood_tracker')
      expect(screen.getByText('habit_tracker')).toBeInTheDocument()
      expect(screen.getByText('daily_summary')).toBeInTheDocument()
      expect(screen.getByText('gratitude')).toBeInTheDocument()
    })
  })

  describe('removing items', () => {
    it('calls removeTemplateWidget with the widget id and refreshes', async () => {
      render(<Template />)
      await screen.findByText('mood_tracker')

      // Each widget row has 3 buttons: [Up], [Down], [-]. Index 2 is delete.
      const moodRow = screen.getByText('mood_tracker').closest('div')!
      const deleteBtn = moodRow.querySelectorAll('button')[2]
      await userEvent.click(deleteBtn)

      expect(window.api.template.removeTemplateWidget).toHaveBeenCalledWith(101)
      // refresh = a second getActiveTemplate call
      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalledTimes(2)
      })
    })

    it('calls removeTemplateWriting with the writing id and refreshes', async () => {
      render(<Template />)
      await screen.findByText('daily_summary')

      const summaryRow = screen.getByText('daily_summary').closest('div')!
      const deleteBtn = summaryRow.querySelectorAll('button')[2]
      await userEvent.click(deleteBtn)

      expect(window.api.template.removeTemplateWriting).toHaveBeenCalledWith(201)
      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('reordering items', () => {
    it('calls changeTemplateWidgetPosition with position - 1 when [Up] is clicked', async () => {
      render(<Template />)
      await screen.findByText('habit_tracker')

      const habitRow = screen.getByText('habit_tracker').closest('div')!
      const upBtn = habitRow.querySelectorAll('button')[0]
      await userEvent.click(upBtn)

      // habit_tracker is at position 1, moving up = 0
      expect(window.api.template.changeTemplateWidgetPosition).toHaveBeenCalledWith(102, 0)
    })

    it('calls changeTemplateWritingPosition with position + 1 when [Down] is clicked', async () => {
      render(<Template />)
      await screen.findByText('daily_summary')

      const summaryRow = screen.getByText('daily_summary').closest('div')!
      const downBtn = summaryRow.querySelectorAll('button')[1]
      await userEvent.click(downBtn)

      // daily_summary is at position 0, moving down = 1
      expect(window.api.template.changeTemplateWritingPosition).toHaveBeenCalledWith(201, 1)
    })
  })

  describe('add dropdown', () => {
    it('only lists widget types not already present', async () => {
      render(<Template />)
      await screen.findByText('mood_tracker')

      // Two selects on the page: first = widgets (mood_tracker + habit_tracker present)
      const widgetSelect = screen.getAllByRole('combobox')[0]
      const optionTexts = Array.from(widgetSelect.querySelectorAll('option')).map((o) => o.value)

      // Placeholder option has empty value; real options should exclude the present types
      expect(optionTexts).toContain('')
      expect(optionTexts).not.toContain('mood_tracker')
      expect(optionTexts).not.toContain('habit_tracker')
      // Remaining types still available
      const expectedAvailable = WIDGET_TYPES.filter(
        (t) => t !== 'mood_tracker' && t !== 'habit_tracker'
      )
      expectedAvailable.forEach((t) => expect(optionTexts).toContain(t))
    })

    it('calls addTemplateWidget with the template id and selected type', async () => {
      render(<Template />)
      await screen.findByText('mood_tracker')

      const widgetSelect = screen.getAllByRole('combobox')[0]
      await userEvent.selectOptions(widgetSelect, 'todo_list')

      expect(window.api.template.addTemplateWidget).toHaveBeenCalledWith(TEMPLATE_ID, 'todo_list')
      await waitFor(() => {
        expect(window.api.template.getActiveTemplate).toHaveBeenCalledTimes(2)
      })
    })

    it('calls addTemplateWriting with template id, type, and the default label for the type', async () => {
      render(<Template />)
      await screen.findByText('daily_summary')

      // Second select = writings (daily_summary + gratitude present)
      const writingSelect = screen.getAllByRole('combobox')[1]
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
      await screen.findByText(WIDGET_TYPES[0])

      // Only the writings select should be present (writings list is empty)
      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(1)
    })

    it('hides the writing add dropdown when all selectable writing types are present', async () => {
      const selectableTypes = WRITING_TYPES.filter((t) => t !== 'custom')
      vi.mocked(window.api.template.getActiveTemplate).mockResolvedValue({
        id: TEMPLATE_ID,
        widgets: [],
        writings: selectableTypes.map((type, i) => writing({ id: 200 + i, type, position: i }))
      })

      render(<Template />)
      await screen.findByText(selectableTypes[0])

      // Only the widgets select should be present (writings list is fully populated)
      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(1)
    })

    it('does not list "custom" in the writings dropdown', async () => {
      render(<Template />)
      await screen.findByText('daily_summary')

      const writingSelect = screen.getAllByRole('combobox')[1]
      const optionValues = Array.from(writingSelect.querySelectorAll('option')).map((o) => o.value)
      expect(optionValues).not.toContain('custom')
    })
  })
})
