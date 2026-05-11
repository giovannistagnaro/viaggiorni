import { Habit, SafeReturnSettings } from '@shared/types'
import { SyntheticEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

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

  if (!settings) return <div>Loading...</div>

  return (
    <div>
      <div>
        <span>Streak Tolerance: </span>
        <input
          type="number"
          min="0"
          step="1"
          defaultValue={settings.streakTolerance}
          onBlur={(e) => handleStreakToleranceBlur(Number(e.target.value))}
        />
      </div>

      <section aria-label="Habits">
        <h3>Habits</h3>
        {habits.length === 0 ? (
          <p>No habits yet.</p>
        ) : (
          <ul>
            {habits.map((habit) => (
              <li key={habit.id}>
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: habit.color
                  }}
                />
                <span>{habit.name}</span>
                <button
                  type="button"
                  onClick={() => handleArchiveHabit(habit.id)}
                  aria-label={`Archive ${habit.name}`}
                >
                  Archive
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddHabit}>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            aria-label="Habit color"
          />
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit..."
            aria-label="Habit name"
          />
          <button type="submit">Add habit</button>
        </form>
      </section>
    </div>
  )
}

export default HabitSettings
