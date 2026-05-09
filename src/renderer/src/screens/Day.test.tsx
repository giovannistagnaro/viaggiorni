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

    render(<Day />)

    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
    expect(window.api.entries.create).not.toHaveBeenCalled()
  })

  it('creates a new entry when none exists for today', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(null)
    vi.mocked(window.api.entries.create).mockResolvedValue(mockEntry)

    render(<Day />)

    await waitFor(() => {
      expect(window.api.entries.create).toHaveBeenCalled()
    })
    expect(await screen.findByDisplayValue(mockEntry.title)).toBeInTheDocument()
  })

  it('calls updateTitle on blur when title changes', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day />)

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.tripleClick(input)
    await userEvent.keyboard('Updated title')
    await userEvent.tab()

    expect(window.api.entries.updateTitle).toHaveBeenCalledWith(mockEntry.id, 'Updated title')
  })

  it('does not call updateTitle when title is unchanged', async () => {
    vi.mocked(window.api.entries.getByDate).mockResolvedValue(mockEntry)

    render(<Day />)

    const input = await screen.findByDisplayValue(mockEntry.title)

    await userEvent.click(input)
    await userEvent.tab()

    expect(window.api.entries.updateTitle).not.toHaveBeenCalled()
  })
})
