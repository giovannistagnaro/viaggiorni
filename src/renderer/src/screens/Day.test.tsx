import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Day from './Day'
import type { EntryWidget, EntryWriting } from '@shared/types'
import { WIDGET_TYPES, WRITING_TYPES, WRITING_TYPE_LABELS } from '@shared/constants'

// Stub the inner renderers to keep these tests focused on Day's structure logic
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

// Default "today" is one day after the mock entry's date so right-nav is available.
// Tests that exercise the today boundary override this per-render.
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

    render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
    expect(window.api.entries.create).not.toHaveBeenCalled()
  })

  it('creates a new entry when none exists for today', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(null)
    vi.mocked(window.api.entries.create).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

    await waitFor(() => {
      expect(window.api.entries.create).toHaveBeenCalled()
    })
    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
  })

  it('calls updateTitle on blur when title changes', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.tripleClick(input)
    await userEvent.keyboard('Updated title')
    await userEvent.tab()

    expect(window.api.entries.updateTitle).toHaveBeenCalledWith(mockEntry.id, 'Updated title')
  })

  it('does not call updateTitle when title is unchanged', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.click(input)
    await userEvent.tab()

    expect(window.api.entries.updateTitle).not.toHaveBeenCalled()
  })

  describe('bookmark', () => {
    it('renders "Bookmark" when the entry is not bookmarked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

      expect(await screen.findByRole('button', { name: 'Bookmark' })).toBeInTheDocument()
    })

    it('renders "Un-bookmark" when the entry is already bookmarked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue({
        ...mockEntry,
        isBookmarked: true
      })

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

      expect(await screen.findByRole('button', { name: 'Un-bookmark' })).toBeInTheDocument()
    })

    it('calls toggleBookmark with the entry id when clicked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Bookmark' }))

      expect(window.api.entries.toggleBookmark).toHaveBeenCalledWith(mockEntry.id)
    })

    it('flips the button label after toggling', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
      vi.mocked(window.api.entries.toggleBookmark).mockResolvedValue(undefined)

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Bookmark' }))

      expect(await screen.findByRole('button', { name: 'Un-bookmark' })).toBeInTheDocument()
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

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

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

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

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
      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)

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

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      expect(screen.getByText('mood_tracker')).toBeInTheDocument()
      expect(screen.getByText('habit_tracker')).toBeInTheDocument()
    })

    it('calls setVisibility when the Hide/Show button is clicked', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', isVisible: true })
      ])

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
      await userEvent.click(screen.getByRole('button', { name: 'Hide' }))

      expect(window.api.entryWidgets.setVisibility).toHaveBeenCalledWith(101, false)
    })

    it('calls changePosition with position - 1 when [Up] is clicked on a widget', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', position: 0 }),
        widget({ id: 102, type: 'habit_tracker', position: 1 })
      ])

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      const habitRow = screen.getByText('habit_tracker').closest('div')!
      const upBtn = habitRow.querySelectorAll('button')[0]
      await userEvent.click(upBtn)

      expect(window.api.entryWidgets.changePosition).toHaveBeenCalledWith(102, 0)
    })

    it('calls changePosition with position + 1 when [Down] is clicked on a writing', async () => {
      vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([
        writing({ id: 201, type: 'daily_summary', label: 'Daily Summary', position: 0 }),
        writing({ id: 202, type: 'gratitude', label: 'Gratitude', position: 1 })
      ])

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      const summaryRow = screen.getByText('Daily Summary').closest('div')!
      const downBtn = summaryRow.querySelectorAll('button')[1]
      await userEvent.click(downBtn)

      expect(window.api.entryWritings.changePosition).toHaveBeenCalledWith(201, 1)
    })

    it('calls updateColSpan when the colSpan select is changed', async () => {
      vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
        widget({ id: 101, type: 'mood_tracker', colSpan: 2 })
      ])

      render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      // The widget row's only <select> is the colSpan picker (Half/Full)
      const moodRow = screen.getByText('mood_tracker').closest('div')!
      const colSpanSelect = moodRow.querySelector('select') as HTMLSelectElement
      await userEvent.selectOptions(colSpanSelect, '4')

      expect(window.api.entryWidgets.updateColSpan).toHaveBeenCalledWith(101, 4)
    })

    describe('add dropdowns', () => {
      it('only lists widget types not already present in the entry', async () => {
        vi.mocked(window.api.entryWidgets.getWidgetsForEntry).mockResolvedValue([
          widget({ id: 101, type: 'mood_tracker' }),
          widget({ id: 102, type: 'habit_tracker' })
        ])

        render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const widgetAdd = screen.getByText('[+] Add widget').closest('select')!
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

        render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const widgetAdd = screen.getByText('[+] Add widget').closest('select')!
        await userEvent.selectOptions(widgetAdd, 'mood_tracker')

        expect(window.api.entryWidgets.addEntryWidget).toHaveBeenCalledWith(
          mockEntry.id,
          'mood_tracker'
        )
      })

      it('calls addEntryWriting with the default label when a writing type is selected', async () => {
        vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([])

        render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const writingAdd = screen.getByText('[+] Add writing').closest('select')!
        await userEvent.selectOptions(writingAdd, 'notable_moment')

        expect(window.api.entryWritings.addEntryWriting).toHaveBeenCalledWith(
          mockEntry.id,
          'notable_moment',
          WRITING_TYPE_LABELS.notable_moment
        )
      })

      it('does not list "custom" in the writings add dropdown', async () => {
        vi.mocked(window.api.entryWritings.getWritingsForEntry).mockResolvedValue([])

        render(<Day entryDate={mockEntry.date} onNavigateToDay={vi.fn()} today={TODAY} />)
        await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

        const writingAdd = screen.getByText('[+] Add writing').closest('select')!
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

      render(<Day entryDate="2026-05-01" onNavigateToDay={onNavigateToDay} today={TODAY} />)
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.click(screen.getByRole('button', { name: '<' }))

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-04-30')
    })

    it('renders a right button when entryDate is before today', async () => {
      render(<Day entryDate="2026-05-01" onNavigateToDay={vi.fn()} today="2026-05-02" />)

      expect(await screen.findByRole('button', { name: '>' })).toBeInTheDocument()
    })

    it('clicking the right button navigates to the next day', async () => {
      const onNavigateToDay = vi.fn()

      render(<Day entryDate="2026-05-01" onNavigateToDay={onNavigateToDay} today="2026-05-03" />)
      await screen.findByDisplayValue(mockEntry.title)

      await userEvent.click(screen.getByRole('button', { name: '>' }))

      expect(onNavigateToDay).toHaveBeenCalledWith('2026-05-02')
    })

    it('hides the right button when entryDate equals today', async () => {
      render(<Day entryDate="2026-05-01" onNavigateToDay={vi.fn()} today="2026-05-01" />)
      await screen.findByDisplayValue(mockEntry.title)

      expect(screen.queryByRole('button', { name: '>' })).not.toBeInTheDocument()
    })

    it('hides the right button when entryDate is somehow after today', async () => {
      // Defensive: this state shouldn't occur in practice, but verifying the boundary holds
      render(<Day entryDate="2026-05-05" onNavigateToDay={vi.fn()} today="2026-05-01" />)
      await screen.findByDisplayValue(mockEntry.title)

      expect(screen.queryByRole('button', { name: '>' })).not.toBeInTheDocument()
    })
  })
})
