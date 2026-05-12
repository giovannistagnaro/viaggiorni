import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Day from './Day'
import type { EntryWidget, EntryWriting } from '@shared/types'
import {
  WIDGET_TYPES,
  WIDGET_TYPE_LABELS,
  WRITING_TYPES,
  WRITING_TYPE_LABELS
} from '@shared/constants'

function renderDay({
  entryDate,
  onNavigateToDay,
  today
}: {
  entryDate: string
  onNavigateToDay?: (date: string) => void
  today: string
}): ReturnType<typeof render> {
  function Harness(): React.JSX.Element {
    const [editMode, setEditMode] = useState(false)
    return (
      <>
        <button onClick={() => setEditMode((v) => !v)}>{editMode ? 'Done' : 'Edit'}</button>
        <Day
          entryDate={entryDate}
          onNavigateToDay={onNavigateToDay ?? vi.fn()}
          today={today}
          editMode={editMode}
          onSetEditMode={setEditMode}
        />
      </>
    )
  }
  return render(<Harness />)
}

vi.mock('@renderer/components/WidgetRenderer', () => ({
  default: ({ widget }: { widget: EntryWidget }) => (
    <div data-testid={`widget-rendered-${widget.id}`}>{widget.type}</div>
  )
}))
vi.mock('@renderer/components/WritingEditor', () => ({
  default: ({ writing }: { writing: EntryWriting }) => (
    <div data-testid={`writing-rendered-${writing.id}`}>{writing.label ?? writing.type}</div>
  )
}))

const mockEntry = {
  id: 1,
  title: 'Friday, May 1',
  date: '2026-05-01',
  isBookmarked: false,
  createdAt: '2026-05-01T00:00:00',
  updatedAt: null
}

const TODAY = '2026-05-02'

const widget = (overrides: Partial<EntryWidget> = {}): EntryWidget => ({
  id: 100,
  entryId: mockEntry.id,
  type: 'mood_tracker',
  position: 0,
  colSpan: 2,
  isVisible: true,
  createdAt: '2026-05-01T00:00:00',
  ...overrides
})

const writing = (overrides: Partial<EntryWriting> = {}): EntryWriting => ({
  id: 200,
  entryId: mockEntry.id,
  type: 'daily_summary',
  label: 'Daily Summary',
  content: null,
  prompt: null,
  position: 0,
  isVisible: true,
  createdAt: '2026-05-01T00:00:00',
  updatedAt: null,
  ...overrides
})

beforeEach(() => {
  window.api = {
    db: {
      open: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      isUnlocked: vi.fn(),
      isFirstLaunch: vi.fn()
    },
    user: {
      getUsername: vi.fn().mockResolvedValue(''),
      setUsername: vi.fn()
    },
    entries: {
      getByDate: vi.fn(),
      create: vi.fn(),
      updateTitle: vi.fn().mockResolvedValue(undefined),
      toggleBookmark: vi.fn(),
      getAllBookmarked: vi.fn()
    },
    entryWidgets: {
      getWidgetsForEntry: vi.fn().mockResolvedValue([]),
      setVisibility: vi.fn().mockResolvedValue(undefined),
      changePosition: vi.fn().mockResolvedValue(undefined),
      addEntryWidget: vi.fn().mockResolvedValue(undefined),
      updateColSpan: vi.fn().mockResolvedValue(undefined)
    },
    entryWritings: {
      getWritingsForEntry: vi.fn().mockResolvedValue([]),
      updateWritingContent: vi.fn(),
      updateWritingPrompt: vi.fn(),
      getOrCreatePromptForWriting: vi.fn().mockResolvedValue(null),
      setVisibility: vi.fn().mockResolvedValue(undefined),
      changePosition: vi.fn().mockResolvedValue(undefined),
      addEntryWriting: vi.fn().mockResolvedValue(undefined)
    }
  } as never
})

describe('Main', () => {
  it('loads and displays the existing entry for today', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    renderDay({ entryDate: mockEntry.date, today: TODAY })

    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
    expect(window.api.entries.create).not.toHaveBeenCalled()
  })

  it('creates a new entry when none exists for today', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(null)
    vi.mocked(window.api.entries.create).mockResolvedValue(mockEntry)

    renderDay({ entryDate: mockEntry.date, today: TODAY })

    await waitFor(() => {
      expect(window.api.entries.create).toHaveBeenCalled()
    })
    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
  })

  it('calls updateTitle on blur when title changes', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    renderDay({ entryDate: mockEntry.date, today: TODAY })

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.tripleClick(input)
    await userEvent.keyboard('Updated title')
    await userEvent.tab()

    expect(window.api.entries.updateTitle).toHaveBeenCalledWith(mockEntry.id, 'Updated title')
  })

  it('does not call updateTitle when title is unchanged', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    renderDay({ entryDate: mockEntry.date, today: TODAY })

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.click(input)
    await userEvent.tab()

    expect(window.api.entries.updateTitle).not.toHaveBeenCalled()
  })

  describe('bookmark', () => {
    it('renders an unbookmarked tab when the entry is not bookmarked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

      renderDay({ entryDate: mockEntry.date, today: TODAY })

      expect(
        await screen.findByRole('button', { name: 'Bookmark this page (May)' })
      ).toBeInTheDocument()
    })

    it('renders a bookmarked tab when the entry is already bookmarked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue({
        ...mockEntry,
        isBookmarked: true
      })

      renderDay({ entryDate: mockEntry.date, today: TODAY })

      expect(
        await screen.findByRole('button', { name: 'Remove bookmark (May)' })
      ).toBeInTheDocument()
    })

    it('calls toggleBookmark with the entry id when the tab is clicked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(
        await screen.findByRole('button', { name: 'Bookmark this page (May)' })
      )

      expect(window.api.entries.toggleBookmark).toHaveBeenCalledWith(mockEntry.id)
    })

    it('flips the tab label after toggling', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
      vi.mocked(window.api.entries.toggleBookmark).mockResolvedValue(undefined)

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(
        await screen.findByRole('button', { name: 'Bookmark this page (May)' })
      )

      expect(
        await screen.findByRole('button', { name: 'Remove bookmark (May)' })
      ).toBeInTheDocument()
    })
  })

  describe('structure rendering', () => {
    it('only renders visible widgets and writings in normal mode', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', isVisible: true }),
        widget({ id: 102, type: 'habit_tracker', isVisible: false })
      ])
      vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([
        writing({ id: 201, type: 'daily_summary', label: 'Daily Summary', isVisible: true }),
        writing({ id: 202, type: 'gratitude', label: 'Gratitude', isVisible: false })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })

      expect(await screen.findByTestId('widget-rendered-101')).toBeInTheDocument()
      expect(screen.queryByTestId('widget-rendered-102')).not.toBeInTheDocument()
      expect(screen.getByTestId('writing-rendered-201')).toBeInTheDocument()
      expect(screen.queryByTestId('writing-rendered-202')).not.toBeInTheDocument()
    })

    it('applies the widget colSpan via inline grid-column style', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, colSpan: 4 })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })

      const rendered = await screen.findByTestId('widget-rendered-101')
      const wrapper = rendered.parentElement!
      expect(wrapper.style.gridColumn).toBe('span 4')
    })
  })

  describe('edit mode', () => {
    beforeEach(() => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
    })

    it('toggles the Edit button label between Edit and Done', async () => {
      renderDay({ entryDate: mockEntry.date, today: TODAY })

      const editBtn = await screen.findByRole('button', { name: 'Edit' })
      await userEvent.click(editBtn)
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Done' }))
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })

    it('shows hidden widgets and writings in edit mode', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', isVisible: true }),
        widget({ id: 102, type: 'habit_tracker', isVisible: false })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      expect(screen.getByText(WIDGET_TYPE_LABELS.mood_tracker)).toBeInTheDocument()
      expect(screen.getByText(WIDGET_TYPE_LABELS.habit_tracker)).toBeInTheDocument()
    })

    it('calls setVisibility when the Hide/Show button is clicked', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', isVisible: true })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
      await userEvent.click(screen.getByRole('button', { name: 'Hide mood_tracker' }))

      expect(window.api.entryWidgets.setVisibility).toHaveBeenCalledWith(101, false)
    })

    it('calls changePosition with position - 1 when Up is clicked on a widget', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', position: 0 }),
        widget({ id: 102, type: 'habit_tracker', position: 1 })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      const upBtn = screen.getByRole('button', { name: 'Move habit_tracker up' })
      await userEvent.click(upBtn)

      expect(window.api.entryWidgets.changePosition).toHaveBeenCalledWith(102, 0)
    })

    it('calls changePosition with position + 1 when Down is clicked on a writing', async () => {
      vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([
        writing({ id: 201, type: 'daily_summary', label: 'Daily Summary', position: 0 }),
        writing({ id: 202, type: 'gratitude', label: 'Gratitude', position: 1 })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      const downBtn = screen.getByRole('button', { name: 'Move daily_summary down' })
      await userEvent.click(downBtn)

      expect(window.api.entryWritings.changePosition).toHaveBeenCalledWith(201, 1)
    })

    it('calls updateColSpan when the colSpan select is changed', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', colSpan: 2 })
      ])

      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      const colSpanSelect = screen.getByLabelText('mood_tracker width') as HTMLSelectElement
      await userEvent.selectOptions(colSpanSelect, '4')

      expect(window.api.entryWidgets.updateColSpan).toHaveBeenCalledWith(101, 4)
    })

    describe('add dropdowns', () => {
      it('only lists widget types not already present in the entry', async () => {
        vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
          widget({ id: 101, type: 'mood_tracker' }),
          widget({ id: 102, type: 'habit_tracker' })
        ])

        renderDay({ entryDate: mockEntry.date, today: TODAY })
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const widgetAdd = screen.getByLabelText('Add widget') as HTMLSelectElement
        const optionValues = Array.from(widgetAdd.querySelectorAll('option')).map((o) => o.value)

        expect(optionValues).toContain('')
        expect(optionValues).not.toContain('mood_tracker')
        expect(optionValues).not.toContain('habit_tracker')
        WIDGET_TYPES.filter((t) => t !== 'mood_tracker' && t !== 'habit_tracker').forEach((t) =>
          expect(optionValues).toContain(t)
        )
      })

      it('calls addEntryWidget when a type is selected from the add dropdown', async () => {
        vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([])

        renderDay({ entryDate: mockEntry.date, today: TODAY })
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const widgetAdd = screen.getByLabelText('Add widget') as HTMLSelectElement
        await userEvent.selectOptions(widgetAdd, 'mood_tracker')

        expect(window.api.entryWidgets.addEntryWidget).toHaveBeenCalledWith(
          mockEntry.id,
          'mood_tracker'
        )
      })

      it('calls addEntryWriting with the default label when a writing type is selected', async () => {
        vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([])

        renderDay({ entryDate: mockEntry.date, today: TODAY })
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const writingAdd = screen.getByLabelText('Add writing') as HTMLSelectElement
        await userEvent.selectOptions(writingAdd, 'notable_moment')

        expect(window.api.entryWritings.addEntryWriting).toHaveBeenCalledWith(
          mockEntry.id,
          'notable_moment',
          WRITING_TYPE_LABELS.notable_moment
        )
      })

      it('does not list "custom" in the writings add dropdown', async () => {
        vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([])

        renderDay({ entryDate: mockEntry.date, today: TODAY })
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const writingAdd = screen.getByLabelText('Add writing') as HTMLSelectElement
        const optionValues = Array.from(writingAdd.querySelectorAll('option')).map((o) => o.value)

        expect(optionValues).not.toContain('custom')
        WRITING_TYPES.filter((t) => t !== 'custom').forEach((t) =>
          expect(optionValues).toContain(t)
        )
      })
    })
  })

  describe('day-to-day navigation', () => {
    beforeEach(() => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
    })

    it('renders a left button that navigates to the previous day', async () => {
      const onNavigateToDay = vi.fn()

      renderDay({ entryDate: '2026-05-01', onNavigateToDay, today: TODAY })
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.click(screen.getByRole('button', { name: 'Previous day' }))

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-04-30')
    })

    it('renders a right button when entryDate is before today', async () => {
      renderDay({ entryDate: '2026-05-01', today: '2026-05-02' })

      expect(await screen.findByRole('button', { name: 'Next day' })).toBeInTheDocument()
    })

    it('clicking the right button navigates to the next day', async () => {
      const onNavigateToDay = vi.fn()

      renderDay({ entryDate: '2026-05-01', onNavigateToDay, today: '2026-05-03' })
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.click(screen.getByRole('button', { name: 'Next day' }))

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-05-02')
    })

    it('hides the right button when entryDate equals today', async () => {
      renderDay({ entryDate: '2026-05-01', today: '2026-05-01' })
      await screen.findByDisplayValue(mockEntry.title)

      expect(screen.queryByRole('button', { name: 'Next day' })).not.toBeInTheDocument()
    })

    it('hides the right button when entryDate is somehow after today', async () => {
      renderDay({ entryDate: '2026-05-05', today: '2026-05-01' })
      await screen.findByDisplayValue(mockEntry.title)

      expect(screen.queryByRole('button', { name: 'Next day' })).not.toBeInTheDocument()
    })
  })

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
    })

    it('mod+left navigates to the previous day', async () => {
      const onNavigateToDay = vi.fn()
      renderDay({ entryDate: '2026-05-01', onNavigateToDay, today: '2026-05-02' })
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.keyboard('{Control>}{ArrowLeft}{/Control}')

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-04-30')
    })

    it('mod+right navigates to the next day when before today', async () => {
      const onNavigateToDay = vi.fn()
      renderDay({ entryDate: '2026-05-01', onNavigateToDay, today: '2026-05-03' })
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.keyboard('{Control>}{ArrowRight}{/Control}')

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-05-02')
    })

    it('mod+right is a no-op when entryDate equals today', async () => {
      const onNavigateToDay = vi.fn()
      renderDay({ entryDate: '2026-05-01', onNavigateToDay, today: '2026-05-01' })
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.keyboard('{Control>}{ArrowRight}{/Control}')

      expect(onNavigateToDay).not.toHaveBeenCalled()
    })

    it('mod+b toggles the bookmark on the current entry', async () => {
      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.keyboard('{Control>}b{/Control}')

      expect(window.api.entries.toggleBookmark).toHaveBeenCalledWith(mockEntry.id)
    })

    it('esc exits edit mode when active', async () => {
      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()

      await userEvent.keyboard('{Escape}')

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })

    it('esc is a no-op when not in edit mode', async () => {
      renderDay({ entryDate: mockEntry.date, today: TODAY })
      await screen.findByRole('button', { name: 'Edit' })

      await userEvent.keyboard('{Escape}')

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })
  })
})
