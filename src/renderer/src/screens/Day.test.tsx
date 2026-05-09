import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Day from './Day'

const mockEntry = {
  id: 1,
  title: 'Friday, May 1',
  date: '2026-05-01',
  isBookmarked: false,
  createdAt: '2026-05-01T00:00:00',
  updatedAt: null
}

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
    }
  } as never
})

describe('Main', () => {
  it('loads and displays the existing entry for today', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} />)

    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
    expect(window.api.entries.create).not.toHaveBeenCalled()
  })

  it('creates a new entry when none exists for today', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(null)
    vi.mocked(window.api.entries.create).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} />)

    await waitFor(() => {
      expect(window.api.entries.create).toHaveBeenCalled()
    })
    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
  })

  it('calls updateTitle on blur when title changes', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} />)

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.tripleClick(input)
    await userEvent.keyboard('Updated title')
    await userEvent.tab()

    expect(window.api.entries.updateTitle).toHaveBeenCalledWith(mockEntry.id, 'Updated title')
  })

  it('does not call updateTitle when title is unchanged', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day entryDate={mockEntry.date} />)

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.click(input)
    await userEvent.tab()

    expect(window.api.entries.updateTitle).not.toHaveBeenCalled()
  })

  describe('bookmark', () => {
    it('renders "Bookmark" when the entry is not bookmarked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

      render(<Day entryDate={mockEntry.date} />)

      expect(await screen.findByRole('button', { name: 'Bookmark' })).toBeInTheDocument()
    })

    it('renders "Un-bookmark" when the entry is already bookmarked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue({
        ...mockEntry,
        isBookmarked: true
      })

      render(<Day entryDate={mockEntry.date} />)

      expect(await screen.findByRole('button', { name: 'Un-bookmark' })).toBeInTheDocument()
    })

    it('calls toggleBookmark with the entry id when clicked', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

      render(<Day entryDate={mockEntry.date} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Bookmark' }))

      expect(window.api.entries.toggleBookmark).toHaveBeenCalledWith(mockEntry.id)
    })

    it('flips the button label after toggling', async () => {
      vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)
      vi.mocked(window.api.entries.toggleBookmark).mockResolvedValue(undefined)

      render(<Day entryDate={mockEntry.date} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Bookmark' }))

      expect(await screen.findByRole('button', { name: 'Un-bookmark' })).toBeInTheDocument()
    })
  })
})
