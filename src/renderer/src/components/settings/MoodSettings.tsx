import { MoodTag } from '@shared/types'
import { SyntheticEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

function MoodSettings(): React.JSX.Element {
  const [moodTags, setMoodTags] = useState<MoodTag[]>([])
  const [newTag, setNewTag] = useState('')

  const reloadMoodTags = useCallback(async () => {
    try {
      setMoodTags(await window.api.moodTags.getAllMoodTags())
    } catch (err) {
      console.error('Failed to load mood tags', err)
      toast.error('Failed to load mood tags')
    }
  }, [])

  useEffect(() => {
    async function reloadMoodTagsWrapper(): Promise<void> {
      await reloadMoodTags()
    }
    reloadMoodTagsWrapper()
  }, [reloadMoodTags])

  async function handleAddMoodTag(event: SyntheticEvent): Promise<void> {
    event.preventDefault()
    const trimmed = newTag.trim()
    if (trimmed === '') return
    try {
      await window.api.moodTags.createMoodTag(trimmed)
      setNewTag('')
      await reloadMoodTags()
    } catch (err) {
      console.error('Failed to add mood tag', err)
      toast.error('Failed to add mood tag')
    }
  }

  async function handleRemoveMoodTag(tagId: number): Promise<void> {
    try {
      await window.api.moodTags.removeMoodTag(tagId)
      await reloadMoodTags()
    } catch (err) {
      console.error('Failed to remove mood tag', err)
      toast.error('Failed to remove mood tag')
    }
  }

  return (
    <div>
      <h3>Moods</h3>
      {moodTags.length === 0 ? (
        <p>No moods yet.</p>
      ) : (
        <ul>
          {moodTags.map((tag) => (
            <li key={tag.id}>
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveMoodTag(tag.id)}
                aria-label={`Remove ${tag.label}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAddMoodTag}>
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="New mood..."
          aria-label="Mood name"
        />
        <button type="submit">Add mood</button>
      </form>
    </div>
  )
}

export default MoodSettings
