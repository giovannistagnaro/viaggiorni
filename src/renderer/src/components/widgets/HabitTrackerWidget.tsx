import { Habit } from '@shared/types'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  entryDate: string
}

function HabitTrackerWidget({ entryDate }: Props): React.JSX.Element {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitCompletion, setHabitCompletion] = useState<Map<number, boolean>>(new Map())

  const setHabitCompletionMap = useCallback(async () => {
    let activeHabits: Habit[]
    try {
      activeHabits = await window.api.habit.getActiveHabits()
      setHabits(activeHabits)
    } catch (err) {
      console.error('Failed to load habits', err)
      toast.error('Failed to load habits')
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
      toast.error('Failed to load habit completion')
    }
  }, [entryDate])

  useEffect(() => {
    async function setHabitCompletionMapWrapper(): Promise<void> {
      await setHabitCompletionMap()
    }
    setHabitCompletionMapWrapper()
  }, [setHabitCompletionMap])

  async function handleToggleHabit(habitId: number, date: string): Promise<void> {
    try {
      setHabitCompletion((prev) => new Map(prev).set(habitId, !prev.get(habitId)))
      await window.api.habit.toggleHabitCompleted(habitId, date)
    } catch (err) {
      console.error('Failed to toggle habit completion', err)
      toast.error('Failed to toggle habit completion')
    }
  }

  if (habits.length === 0) {
    return (
      <p className="font-serif text-ink-soft text-sm italic">
        No habits yet — add some in Settings.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-ink/10">
      {habits.map((habit) => (
        <li key={habit.id}>
          <label className="flex items-center gap-3 py-2 cursor-pointer rounded px-1 -mx-1 hover:bg-ink/[0.04]">
            <span
              className="h-3 w-3 rounded-full flex-none ring-1 ring-black/10"
              style={{ backgroundColor: habit.color }}
              aria-hidden
            />
            <span className="font-serif text-ink text-sm flex-1">{habit.name}</span>
            <input
              type="checkbox"
              checked={habitCompletion.get(habit.id) ?? false}
              onChange={() => handleToggleHabit(habit.id, entryDate)}
              className="w-4 h-4 accent-ink cursor-pointer"
              aria-label={habit.name}
            />
          </label>
        </li>
      ))}
    </ul>
  )
}

export default HabitTrackerWidget
