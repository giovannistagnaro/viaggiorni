import { Habit, SafeReturnSettings } from '@shared/types'
import { SyntheticEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Archive } from 'lucide-react'
import { Row, SETTINGS_INPUT, Subsection } from './_shared'

function HabitSettings(): React.JSX.Element {
  const [settings, setSettings] = useState<SafeReturnSettings | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState('')
  const [newColor, setNewColor] = useState('#6586db')

  const reloadHabits = useCallback(async () => {
    try {
      setHabits(await window.api.habit.getActiveHabits())
    } catch (err) {
      console.error('Failed to load habits', err)
      toast.error('Failed to load habits')
    }
  }, [])

  useEffect(() => {
    async function init(): Promise<void> {
      try {
        setSettings(await window.api.settings.getSettings())
      } catch (err) {
        console.error('Failed to load settings', err)
        toast.error('Failed to load settings')
      }
      await reloadHabits()
    }
    init()
  }, [reloadHabits])

  async function handleStreakToleranceBlur(newTolerance: number): Promise<void> {
    if (!Number.isInteger(newTolerance) || newTolerance < 0) return
    try {
      if (!settings) return
      await window.api.settings.updateStreakTolerance(newTolerance)
      setSettings({ ...settings, streakTolerance: newTolerance })
    } catch (err) {
      console.error('Failed to change streak tolerance', err)
      toast.error('Failed to change streak tolerance')
    }
  }

  async function handleAddHabit(event: SyntheticEvent): Promise<void> {
    event.preventDefault()
    const trimmed = newHabit.trim()
    if (trimmed === '') return
    try {
      await window.api.habit.createHabit(trimmed, newColor)
      setNewHabit('')
      setNewColor('#6586db')
      await reloadHabits()
    } catch (err) {
      console.error('Failed to create habit', err)
      toast.error('Failed to create habit')
    }
  }

  async function handleArchiveHabit(habitId: number): Promise<void> {
    try {
      await window.api.habit.archiveHabit(habitId)
      await reloadHabits()
    } catch (err) {
      console.error('Failed to archive habit', err)
      toast.error('Failed to archive habit')
    }
  }

  if (!settings) {
    return <p className="font-serif text-muted-foreground text-sm italic">Loading…</p>
  }

  return (
    <>
      <Row
        label="Streak tolerance"
        description="Allowed missed days before a streak breaks."
        htmlFor="settings-streak-tolerance"
      >
        <input
          id="settings-streak-tolerance"
          type="number"
          min="0"
          step="1"
          defaultValue={settings.streakTolerance}
          onBlur={(e) => handleStreakToleranceBlur(Number(e.target.value))}
          className={`${SETTINGS_INPUT} w-24`}
        />
      </Row>

      <Subsection title="Habits">
        {habits.length === 0 ? (
          <p className="font-serif text-muted-foreground text-sm italic mb-4">
            No habits yet — add one below.
          </p>
        ) : (
          <ul className="divide-y divide-border mb-4">
            {habits.map((habit) => (
              <li
                key={habit.id}
                className="group flex items-center gap-3 py-2"
              >
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full flex-none ring-1 ring-black/10"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="font-serif text-foreground text-sm flex-1">{habit.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArchiveHabit(habit.id)}
                  aria-label={`Archive ${habit.name}`}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Archive />
                  Archive
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddHabit} className="flex items-center gap-2">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            aria-label="Habit color"
            className="h-9 w-12 rounded-md border border-input cursor-pointer bg-background flex-none p-1"
          />
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit..."
            aria-label="Habit name"
            className={SETTINGS_INPUT}
          />
          <Button type="submit" disabled={newHabit.trim() === ''}>
            Add habit
          </Button>
        </form>
      </Subsection>
    </>
  )
}

export default HabitSettings
