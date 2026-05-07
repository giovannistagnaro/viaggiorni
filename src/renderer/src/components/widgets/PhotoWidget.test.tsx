import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhotoWidget from './PhotoWidget'
import type { EntryPhoto } from '@shared/types'

const ENTRY_ID = 1

const basePhoto = (overrides: Partial<EntryPhoto> = {}): EntryPhoto => ({
  id: 1,
  entryId: ENTRY_ID,
  filePath: 'photos/abc.enc',
  mimeType: 'image/jpeg',
  caption: null,
  position: 0,
  createdAt: '2026-05-04 00:00:00',
  updatedAt: null,
  ...overrides
})

beforeEach(() => {
  window.api = {
    db: { open: vi.fn(), close: vi.fn(), isUnlocked: vi.fn(), isFirstLaunch: vi.fn() },
    user: { getUsername: vi.fn(), setUsername: vi.fn() },
    entries: {
      getByDate: vi.fn(),
      create: vi.fn(),
      updateTitle: vi.fn(),
      toggleBookmark: vi.fn(),
      getAllBookmarked: vi.fn()
    },
    entryWritings: {
      getWritingsForEntry: vi.fn(),
      updateWritingContent: vi.fn(),
      updateWritingPrompt: vi.fn(),
      getOrCreatePromptForWriting: vi.fn()
    },
    entryWidgets: { getWidgetsForEntry: vi.fn() },
    todos: {
      createTodo: vi.fn(),
      getTodosForDate: vi.fn(),
      toggleTodoCompleted: vi.fn(),
      deleteTodo: vi.fn(),
      updateTodoLabel: vi.fn(),
      changeTodoPosition: vi.fn()
    },
    moodTags: {
      getAllMoodTags: vi.fn(),
      getMoodTagsForEntry: vi.fn(),
      addMoodTagToEntry: vi.fn(),
      removeMoodTagFromEntry: vi.fn(),
      removeMoodTag: vi.fn(),
      createMoodTag: vi.fn()
    },
    habit: {
      getActiveHabits: vi.fn(),
      createHabit: vi.fn(),
      archiveHabit: vi.fn(),
      unarchiveHabit: vi.fn(),
      updateHabit: vi.fn(),
      getHabitLogForDate: vi.fn(),
      toggleHabitCompleted: vi.fn(),
      pauseHabit: vi.fn(),
      resumeHabit: vi.fn(),
      calculateStreak: vi.fn()
    },
    wordOfDay: { getOrCreateForDate: vi.fn() },
    entryPhotos: {
      createPhoto: vi.fn(),
      getPhotoById: vi.fn(),
      getPhotosForEntry: vi.fn().mockResolvedValue([]),
      deletePhoto: vi.fn().mockResolvedValue(undefined),
      updatePhotoCaption: vi.fn(),
      changePhotoPosition: vi.fn()
    }
  } as never
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PhotoWidget', () => {
  describe('initial render', () => {
    it('shows a loading state while photos are being fetched', () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockImplementation(
        () => new Promise(() => {}) // never resolves
      )

      render(<PhotoWidget entryId={ENTRY_ID} />)

      expect(screen.getByText(/^Loading\.\.\./i)).toBeInTheDocument()
    })

    it('calls getPhotosForEntry with the entry id on mount', async () => {
      render(<PhotoWidget entryId={ENTRY_ID} />)

      await waitFor(() => {
        expect(window.api.entryPhotos.getPhotosForEntry).toHaveBeenCalledWith(ENTRY_ID)
      })
    })
  })

  describe('when no photos exist', () => {
    it('renders the "No photos yet" empty state', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])

      render(<PhotoWidget entryId={ENTRY_ID} />)

      expect(await screen.findByText(/No photos yet/i)).toBeInTheDocument()
    })

    it('shows an add button in the empty state', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])

      render(<PhotoWidget entryId={ENTRY_ID} />)

      await screen.findByText(/No photos yet/i)
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
    })

    it('does not render navigation controls', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])

      render(<PhotoWidget entryId={ENTRY_ID} />)

      await screen.findByText(/No photos yet/i)
      expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument()
    })
  })

  describe('when photos exist', () => {
    const photos = [
      basePhoto({ id: 10, position: 0, caption: 'First' }),
      basePhoto({ id: 11, position: 1, caption: 'Second' }),
      basePhoto({ id: 12, position: 2, caption: 'Third' })
    ]

    it('fetches the data URL for the first photo on mount', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: 'First'
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)

      await waitFor(() => {
        expect(window.api.entryPhotos.getPhotoById).toHaveBeenCalledWith(10)
      })
    })

    it('renders the image with the fetched data URL', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: 'First'
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)

      const img = (await screen.findByRole('img')) as HTMLImageElement
      expect(img.src).toBe('data:image/jpeg;base64,XXX')
    })

    it('renders the caption text', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: 'First'
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)

      expect(await screen.findByText('First')).toBeInTheDocument()
    })

    it('uses the caption from the photo row as the image alt text', async () => {
      const photoWithCaption = basePhoto({ id: 10, caption: 'A caption' })
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([photoWithCaption])
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: 'A caption'
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)

      const img = (await screen.findByRole('img')) as HTMLImageElement
      expect(img.alt).toBe('A caption')
    })

    it('renders all four nav controls when photos exist', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: null
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)

      await screen.findByRole('img')
      expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add photo' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete photo' })).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    const photos = [
      basePhoto({ id: 10, position: 0, caption: 'First' }),
      basePhoto({ id: 11, position: 1, caption: 'Second' }),
      basePhoto({ id: 12, position: 2, caption: 'Third' })
    ]

    function setupPhotosAndUrls(): void {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockImplementation(async (photoId) => ({
        dataUrl: `data:image/jpeg;base64,photo${photoId}`,
        caption: photos.find((p) => p.id === photoId)?.caption ?? null
      }))
    }

    it('moves to the next photo when Next is clicked', async () => {
      setupPhotosAndUrls()

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByText('First')

      await userEvent.click(screen.getByRole('button', { name: 'Next photo' }))

      await waitFor(() => {
        expect(window.api.entryPhotos.getPhotoById).toHaveBeenCalledWith(11)
      })
    })

    it('moves to the previous photo when Previous is clicked', async () => {
      setupPhotosAndUrls()

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByText('First')

      // From the first photo, previous should wrap to the last
      await userEvent.click(screen.getByRole('button', { name: 'Previous photo' }))

      await waitFor(() => {
        expect(window.api.entryPhotos.getPhotoById).toHaveBeenCalledWith(12)
      })
    })

    it('wraps from the last photo back to the first on Next', async () => {
      setupPhotosAndUrls()

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByText('First')

      const nextButton = screen.getByRole('button', { name: 'Next photo' })
      await userEvent.click(nextButton) // → photo 11
      await userEvent.click(nextButton) // → photo 12
      await userEvent.click(nextButton) // wraps → photo 10

      await waitFor(() => {
        const calls = vi.mocked(window.api.entryPhotos.getPhotoById).mock.calls
        // last call should be for the first photo again
        expect(calls[calls.length - 1][0]).toBe(10)
      })
    })
  })

  describe('add photo', () => {
    it('calls createPhoto with the entry id', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])
      vi.mocked(window.api.entryPhotos.createPhoto).mockResolvedValue(basePhoto())

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByText(/No photos yet/i)

      await userEvent.click(screen.getByRole('button', { name: '+' }))

      expect(window.api.entryPhotos.createPhoto).toHaveBeenCalledWith(ENTRY_ID)
    })

    it('refetches photos after a successful add', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])
      vi.mocked(window.api.entryPhotos.createPhoto).mockResolvedValue(basePhoto())

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByText(/No photos yet/i)
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockClear()

      await userEvent.click(screen.getByRole('button', { name: '+' }))

      await waitFor(() => {
        expect(window.api.entryPhotos.getPhotosForEntry).toHaveBeenCalled()
      })
    })

    it('does not refetch when the user cancels the dialog (createPhoto returns null)', async () => {
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])
      vi.mocked(window.api.entryPhotos.createPhoto).mockResolvedValue(null)

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByText(/No photos yet/i)
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockClear()

      await userEvent.click(screen.getByRole('button', { name: '+' }))

      // give the click a chance to settle; no refetch should occur
      await new Promise((r) => setTimeout(r, 0))
      expect(window.api.entryPhotos.getPhotosForEntry).not.toHaveBeenCalled()
    })
  })

  describe('delete photo', () => {
    it('calls deletePhoto with the current photo id', async () => {
      const photos = [
        basePhoto({ id: 10, caption: 'First', position: 0 }),
        basePhoto({ id: 11, caption: 'Second', position: 1 })
      ]
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: 'First'
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)
      await screen.findByRole('img')

      await userEvent.click(screen.getByRole('button', { name: 'Delete photo' }))

      expect(window.api.entryPhotos.deletePhoto).toHaveBeenCalledWith(10)
    })

    it('refetches photos after a successful delete', async () => {
      const photos = [basePhoto({ id: 10 })]
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: null
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)
      const deleteButton = await screen.findByRole('button', { name: 'Delete photo' })
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockClear()
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])

      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(window.api.entryPhotos.getPhotosForEntry).toHaveBeenCalled()
      })
    })

    it('falls back to the empty state when the only photo is deleted', async () => {
      const photos = [basePhoto({ id: 10 })]
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue(photos)
      vi.mocked(window.api.entryPhotos.getPhotoById).mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,XXX',
        caption: null
      })

      render(<PhotoWidget entryId={ENTRY_ID} />)
      const deleteButton = await screen.findByRole('button', { name: 'Delete photo' })
      vi.mocked(window.api.entryPhotos.getPhotosForEntry).mockResolvedValue([])

      await userEvent.click(deleteButton)

      expect(await screen.findByText(/No photos yet/i)).toBeInTheDocument()
    })
  })
})
