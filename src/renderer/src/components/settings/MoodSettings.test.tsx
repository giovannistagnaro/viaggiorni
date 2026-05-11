import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MoodSettings from './MoodSettings'
import type { MoodTag } from '@shared/types'

const baseTag = (overrides: Partial<MoodTag> = {}): MoodTag => ({
  id: 1,
  label: 'Calm',
  isDefault: true,
  createdAt: '2026-05-01T00:00:00',
  ...overrides
})

beforeEach(() => {
  window.api = {
    moodTags: {
      getAllMoodTags: vi.fn().mockResolvedValue([]),
      getMoodTagsForEntry: vi.fn(),
      addMoodTagToEntry: vi.fn(),
      removeMoodTagFromEntry: vi.fn(),
      removeMoodTag: vi.fn().mockResolvedValue(undefined),
      createMoodTag: vi.fn().mockResolvedValue(undefined)
    }
  } as never
})

describe('MoodSettings', () => {
  it('fetches mood tags on mount', async () => {
    render(<MoodSettings />)

    await waitFor(() => {
      expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalled()
    })
  })

  it('renders all existing mood tags', async () => {
    vi.mocked(window.api.moodTags.getAllMoodTags).mockResolvedValue([
      baseTag({ id: 1, label: 'Calm' }),
      baseTag({ id: 2, label: 'Anxious' })
    ])

    render(<MoodSettings />)

    expect(await screen.findByText('Calm')).toBeInTheDocument()
    expect(await screen.findByText('Anxious')).toBeInTheDocument()
  })

  it('shows a "no moods" message when the list is empty', async () => {
    render(<MoodSettings />)

    expect(await screen.findByText(/No moods yet/i)).toBeInTheDocument()
  })

  it('calls createMoodTag with the trimmed label on submit', async () => {
    render(<MoodSettings />)

    await screen.findByText(/No moods yet/i)
    await userEvent.type(screen.getByLabelText('Mood name'), '  Excited  ')
    await userEvent.click(screen.getByRole('button', { name: 'Add mood' }))

    expect(window.api.moodTags.createMoodTag).toHaveBeenCalledWith('Excited')
  })

  it('does not call createMoodTag when the label is empty', async () => {
    render(<MoodSettings />)

    await screen.findByText(/No moods yet/i)
    await userEvent.click(screen.getByRole('button', { name: 'Add mood' }))

    expect(window.api.moodTags.createMoodTag).not.toHaveBeenCalled()
  })

  it('refetches mood tags after adding', async () => {
    render(<MoodSettings />)

    await waitFor(() => {
      expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalledTimes(1)
    })

    await userEvent.type(screen.getByLabelText('Mood name'), 'Excited')
    await userEvent.click(screen.getByRole('button', { name: 'Add mood' }))

    await waitFor(() => {
      expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalledTimes(2)
    })
  })

  it('removes a mood tag when the Remove button is clicked', async () => {
    vi.mocked(window.api.moodTags.getAllMoodTags).mockResolvedValue([
      baseTag({ id: 7, label: 'Calm' })
    ])

    render(<MoodSettings />)

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Calm' }))

    expect(window.api.moodTags.removeMoodTag).toHaveBeenCalledWith(7)
  })

  it('refetches mood tags after removing', async () => {
    vi.mocked(window.api.moodTags.getAllMoodTags).mockResolvedValue([
      baseTag({ id: 7, label: 'Calm' })
    ])

    render(<MoodSettings />)

    await waitFor(() => {
      expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalledTimes(1)
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Calm' }))

    await waitFor(() => {
      expect(window.api.moodTags.getAllMoodTags).toHaveBeenCalledTimes(2)
    })
  })
})
