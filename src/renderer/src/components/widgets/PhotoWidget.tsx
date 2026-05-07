import { EntryPhoto } from '@shared/types'
import { useCallback, useEffect, useState } from 'react'

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

  // Initial load: inline the fetch so all setState calls are inside the async
  // callback rather than reachable synchronously from the effect body
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
        // TODO: surface to user via error UI
        console.error('Failed to load photo', err)
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
      // TODO: surface to user via error UI
      console.error('Failed to add photo', err)
    }
  }

  async function handleDeletePhoto(): Promise<void> {
    if (!currentPhoto) return
    try {
      await window.api.entryPhotos.deletePhoto(currentPhoto.id)
      const updated = await refreshPhotos()
      setCurrentIndex((idx) => Math.min(idx, Math.max(0, updated.length - 1)))
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to delete photo', err)
    }
  }

  function handleFlip(direction: -1 | 1): void {
    if (photos.length === 0) return
    setCurrentIndex((idx) => (idx + direction + photos.length) % photos.length)
  }

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : photos.length === 0 ? (
        <div>
          <p>No photos yet</p>
          <button onClick={handleAddPhoto}>+</button>
        </div>
      ) : (
        <div>
          <div>
            {gettingImage || !currentDataUrl ? (
              <div>Loading photo...</div>
            ) : (
              <img src={currentDataUrl} alt={currentPhoto?.caption ?? ''} />
            )}
            <h4>{currentPhoto?.caption}</h4>
          </div>
          <div>
            <button onClick={() => handleFlip(-1)} aria-label="Previous photo">
              {'<'}
            </button>
            <button onClick={handleAddPhoto} aria-label="Add photo">
              +
            </button>
            <button onClick={handleDeletePhoto} aria-label="Delete photo">
              -
            </button>
            <button onClick={() => handleFlip(1)} aria-label="Next photo">
              {'>'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoWidget
