import { Habit } from '@shared/types'
import { SyntheticEvent, useCallback, useEffect, useState } from 'react'

interface Props {
  entryDate: string
}

function HabitTrackerWidget({ entryDate }: Props): React.JSX.Element {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitCompletion, setHabitCompletion] = useState<Map<number, boolean>>(new Map())

  const [newHabit, setNewHabit] = useState('')
  const [newColor, setNewColor] = useState('#6586db')

  const setHabitCompletionMap = useCallback(async () => {
    let activeHabits: Habit[]

    try {
      activeHabits = await window.api.habit.getActiveHabits()
      setHabits(activeHabits)
    } catch (err) {
      console.error('Failed to load habits', err)
      return
    }

    try {
      const entries = await Promise.all(
        activeHabits.map(async (habit) => {
          const log = await window.api.habit.getHabitLogForDate(habit.id, entryDate)

          return [habit.id, log?.completed === true] as [number, boolean]
        })
      )

      setHabitCompletion(new Map(entries))
    } catch (err) {
      console.error('Failed to load habit completion', err)
    }
  }, [entryDate])

  useEffect(() => {
    async function setHabitCompletionMapWrapper(): Promise<void> {
      await setHabitCompletionMap()
    }
    setHabitCompletionMapWrapper()
  }, [setHabitCompletionMap])

  async function handleAddHabit(event: SyntheticEvent): Promise<void> {
    event.preventDefault()

    const trimmed = newHabit.trim()
    if (trimmed === '') return

    try {
      await window.api.habit.createHabit(trimmed, newColor)
      setNewHabit('')
      setNewColor('#6586db')
      await setHabitCompletionMap()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to create habit', err)
    }
  }

  async function handleToggleHabit(habitId: number, date: string): Promise<void> {
    try {
      setHabitCompletion((prev) => new Map(prev).set(habitId, !prev.get(habitId)))
      await window.api.habit.toggleHabitCompleted(habitId, date)
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to toggle habit completion', err)
    }
  }

  return (
    <div>
      <form>
        {habits.map((habit) => {
          return (
            <label key={habit.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="habit-list"
                value={habit.name}
                checked={habitCompletion.get(habit.id) ?? false}
                onChange={() => handleToggleHabit(habit.id, entryDate)}
              />
              <span>{habit.name}</span>
              <span
                className="h-4 w-4 rounded-full border border-zinc-400"
                style={{ backgroundColor: habit.color }}
              />
            </label>
          )
        })}
      </form>

      <form onSubmit={handleAddHabit}>
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
        <input type="text" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} />
        <button type="submit">+</button>
      </form>
    </div>
  )
}

export default HabitTrackerWidget
