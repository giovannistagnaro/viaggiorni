import { MoodTag } from '@shared/types'
import { SyntheticEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { X } from 'lucide-react'
import { SETTINGS_INPUT, Subsection } from './_shared'

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
    <>
      <Subsection title="Moods">
        {moodTags.length === 0 ? (
          <p className="font-serif text-muted-foreground text-sm italic mb-4">
            No moods yet — add one below.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2 mb-4">
            {moodTags.map((tag) => (
              <li
                key={tag.id}
                className="group inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border pl-3 pr-1.5 py-1 font-serif text-foreground text-sm"
              >
                <span>{tag.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMoodTag(tag.id)}
                  aria-label={`Remove ${tag.label}`}
                  className="grid place-items-center w-5 h-5 rounded-full text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" strokeWidth={2.25} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddMoodTag} className="flex items-center gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New mood..."
            aria-label="Mood name"
            className={SETTINGS_INPUT}
          />
          <Button type="submit" disabled={newTag.trim() === ''}>
            Add mood
          </Button>
        </form>
      </Subsection>
    </>
  )
}

export default MoodSettings
