import { EntryPhoto } from '@shared/types'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { pickByDate } from '@renderer/utils/pickByDate'

const WASHI_TAPES = Object.values(
  import.meta.glob('@renderer/assets/washi_tape/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

interface Props {
  entryId: number
}

function PhotoWidget({ entryId }: Props): React.JSX.Element {
  const [photos, setPhotos] = useState<EntryPhoto[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentDataUrl, setCurrentDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [gettingImage, setGettingImage] = useState<boolean>(false)

  const currentPhoto = photos[currentIndex]

  const refreshPhotos = useCallback(async (): Promise<EntryPhoto[]> => {
    const result = await window.api.entryPhotos.getPhotosForEntry(entryId)
    setPhotos(result)
    setLoading(false)
    return result
  }, [entryId])

  useEffect(() => {
    let cancelled = false
    async function loadInitial(): Promise<void> {
      const result = await window.api.entryPhotos.getPhotosForEntry(entryId)
      if (cancelled) return
      setPhotos(result)
      setLoading(false)
    }
    loadInitial()
    return () => {
      cancelled = true
    }
  }, [entryId])

  useEffect(() => {
    if (!currentPhoto) return
    let cancelled = false
    async function fetchPhoto(): Promise<void> {
      setGettingImage(true)
      try {
        const result = await window.api.entryPhotos.getPhotoById(currentPhoto.id)
        if (!cancelled) setCurrentDataUrl(result?.dataUrl ?? null)
      } catch (err) {
        console.error('Failed to load photo', err)
        toast.error('Failed to load photo')
      } finally {
        if (!cancelled) setGettingImage(false)
      }
    }
    fetchPhoto()
    return () => {
      cancelled = true
    }
  }, [currentPhoto])

  async function handleAddPhoto(): Promise<void> {
    try {
      const created = await window.api.entryPhotos.createPhoto(entryId)
      if (!created) return
      const updated = await refreshPhotos()
      setCurrentIndex(updated.length - 1)
    } catch (err) {
      console.error('Failed to add photo', err)
      toast.error('Failed to add photo')
    }
  }

  async function handleDeletePhoto(): Promise<void> {
    if (!currentPhoto) return
    try {
      await window.api.entryPhotos.deletePhoto(currentPhoto.id)
      const updated = await refreshPhotos()
      setCurrentIndex((idx) => Math.min(idx, Math.max(0, updated.length - 1)))
    } catch (err) {
      console.error('Failed to delete photo', err)
      toast.error('Failed to delete photo')
    }
  }

  function handleFlip(direction: -1 | 1): void {
    if (photos.length === 0) return
    setCurrentIndex((idx) => (idx + direction + photos.length) % photos.length)
  }

  if (loading) {
    return <div className="font-serif text-ink-soft text-sm italic">Loading…</div>
  }

  if (photos.length === 0) {
    return (
      <div className="font-serif text-ink-soft text-sm italic flex items-center gap-2">
        <span>No photos yet</span>
        <button
          onClick={handleAddPhoto}
          className="text-ink hover:text-ink-soft underline decoration-dotted underline-offset-2"
        >
          +
        </button>
      </div>
    )
  }

  const photoSeed = String(currentPhoto?.id ?? entryId)
  const washiTape = pickByDate(photoSeed, 'photo-tape-tl', WASHI_TAPES)

  return (
    <div>
      <div className="relative inline-block max-w-full">
        {gettingImage || !currentDataUrl ? (
          <div className="flex items-center justify-center bg-paper-aged/30 font-serif text-ink-soft text-sm italic px-12 py-16 rounded-sm">
            Loading photo…
          </div>
        ) : (
          <img
            src={currentDataUrl}
            alt={currentPhoto?.caption ?? ''}
            className="block max-w-full max-h-[240px] object-contain rounded-sm shadow-md"
          />
        )}

        {/* Washi tape on opposite corners — top-left and bottom-right */}
        <img
          src={washiTape}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute -top-2 -left-2 z-10 pointer-events-none select-none"
          style={{
            width: '38%',
            maxWidth: '90px',
            transform: 'rotate(-32deg)',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.22))'
          }}
        />
        <img
          src={washiTape}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute -bottom-2 -right-2 z-10 pointer-events-none select-none"
          style={{
            width: '38%',
            maxWidth: '90px',
            transform: 'rotate(-32deg)',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.22))'
          }}
        />
      </div>

      {currentPhoto?.caption && (
        <h4 className="font-serif text-ink-soft text-sm italic mt-2">{currentPhoto.caption}</h4>
      )}

      <div className="flex items-center gap-2 mt-2 font-serif text-sm">
        <button
          onClick={() => handleFlip(-1)}
          aria-label="Previous photo"
          className="text-ink-soft hover:text-ink text-lg leading-none px-1"
        >
          ‹
        </button>
        <span className="text-ink-soft text-xs tabular-nums">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={() => handleFlip(1)}
          aria-label="Next photo"
          className="text-ink-soft hover:text-ink text-lg leading-none px-1"
        >
          ›
        </button>
        <span className="flex-1" />
        <button
          onClick={handleAddPhoto}
          aria-label="Add photo"
          className="text-ink-soft hover:text-ink text-xs underline decoration-dotted underline-offset-2"
        >
          + Add
        </button>
        <button
          onClick={handleDeletePhoto}
          aria-label="Delete photo"
          className="text-ink-soft hover:text-rust text-base leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default PhotoWidget
