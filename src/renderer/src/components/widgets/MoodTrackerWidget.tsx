import { MoodTag } from '@shared/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  entryId: number
}

function MoodTrackerWidget({ entryId }: Props): React.JSX.Element {
  const [allMoodTags, setAllMoodTags] = useState<MoodTag[]>([])
  const [selectedMoodTags, setSelectedMoodTags] = useState<MoodTag[]>([])

  useEffect(() => {
    async function getMoodTags(): Promise<void> {
      try {
        const all = await window.api.moodTags.getAllMoodTags()
        const selected = await window.api.moodTags.getMoodTagsForEntry(entryId)
        setAllMoodTags(all)
        setSelectedMoodTags(selected)
      } catch (err) {
        console.error('Failed to load mood tags', err)
        toast.error('Failed to load mood tags')
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
      console.error('Failed to toggle mood tag', err)
      toast.error('Failed to toggle mood tag')
    }
  }

  if (allMoodTags.length === 0) {
    return (
      <p className="font-serif text-ink-soft text-sm italic">
        No moods yet — add some in Settings.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {allMoodTags.map((moodTag) => {
        const isSelected = selectedMoodTags.some((selected) => selected.id === moodTag.id)
        return (
          <button
            key={moodTag.id}
            type="button"
            onClick={() => handleToggleSelect(moodTag.id)}
            aria-pressed={isSelected}
            className={`font-serif text-xs px-2.5 py-1 rounded-full border transition-colors ${
              isSelected
                ? 'bg-ink text-paper border-ink'
                : 'bg-transparent text-ink-soft border-ink/25 hover:border-ink/50 hover:text-ink'
            }`}
          >
            {moodTag.label}
          </button>
        )
      })}
    </div>
  )
}

export default MoodTrackerWidget
