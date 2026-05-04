import { MoodTag } from '@shared/types'
import { useEffect, useState } from 'react'

interface Props {
  entryId: number
}

function MoodTrackerWidget({ entryId }: Props): React.JSX.Element {
  const [allMoodTags, setAllMoodTags] = useState<MoodTag[]>([])
  const [selectedMoodTags, setSelectedMoodTags] = useState<MoodTag[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    async function getMoodTags(): Promise<void> {
      try {
        const all = await window.api.moodTags.getAllMoodTags()
        const selected = await window.api.moodTags.getMoodTagsForEntry(entryId)
        setAllMoodTags(all)
        setSelectedMoodTags(selected)
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to load mood tags', err)
      }
    }
    getMoodTags()
  }, [entryId])

  async function handleToggleSelect(moodTagId: number): Promise<void> {
    try {
      if (selectedMoodTags.some((moodTag) => moodTag.id === moodTagId)) {
        await window.api.moodTags.removeMoodTagFromEntry(entryId, moodTagId)
      } else {
        await window.api.moodTags.addMoodTagToEntry(entryId, moodTagId)
      }
      setSelectedMoodTags(await window.api.moodTags.getMoodTagsForEntry(entryId))
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to toggle mood tag', err)
    }
  }

  async function handleAdd(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    const trimmed = newTag.trim()
    if (!trimmed) return

    try {
      await window.api.moodTags.createMoodTag(trimmed)
      setNewTag('')
      setAllMoodTags(await window.api.moodTags.getAllMoodTags())
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to add mood tag', err)
    }
  }

  return (
    <div>
      <div>
        {allMoodTags.map((moodTag) => {
          const isSelected = selectedMoodTags.some((selected) => selected.id === moodTag.id)
          return (
            <button
              key={moodTag.id}
              type="button"
              onClick={() => handleToggleSelect(moodTag.id)}
              className={`px-2 py-1 mx-1 rounded ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {moodTag.label}
            </button>
          )
        })}
      </div>
      <div>
        <form onSubmit={handleAdd}>
          <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
          <button type="submit" disabled={newTag.trim() === ''} aria-label="Add new mood tag">
            +
          </button>
        </form>
      </div>
    </div>
  )
}

export default MoodTrackerWidget
