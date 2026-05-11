import { Habit } from '@shared/types'
import { Flame } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  entryDate: string
}

function HabitTrackerWidget({ entryDate }: Props): React.JSX.Element {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitCompletion, setHabitCompletion] = useState<Map<number, boolean>>(new Map())
  const [habitStreaks, setHabitStreaks] = useState<Map<number, number>>(new Map())

  const loadHabitState = useCallback(async () => {
    let activeHabits: Habit[]
    let tolerance: number
    try {
      activeHabits = await window.api.habit.getActiveHabits()
      setHabits(activeHabits)
      const settings = await window.api.settings.getSettings()
      tolerance = settings.streakTolerance
    } catch (err) {
      console.error('Failed to load habits', err)
      toast.error('Failed to load habits')
      return
    }

    try {
      const results = await Promise.all(
        activeHabits.map(async (habit) => {
          const [log, streak] = await Promise.all([
            window.api.habit.getHabitLogForDate(habit.id, entryDate),
            window.api.habit.calculateStreak(habit.id, entryDate, tolerance)
          ])
          return { id: habit.id, completed: log?.completed === true, streak }
        })
      )
      setHabitCompletion(new Map(results.map(({ id, completed }) => [id, completed])))
      setHabitStreaks(new Map(results.map(({ id, streak }) => [id, streak])))
    } catch (err) {
      console.error('Failed to load habit state', err)
      toast.error('Failed to load habit state')
    }
  }, [entryDate])

  useEffect(() => {
    async function loadHabitStateWrapper(): Promise<void> {
      await loadHabitState()
    }
    loadHabitStateWrapper()
  }, [loadHabitState])

  async function handleToggleHabit(habitId: number, date: string): Promise<void> {
    try {
      setHabitCompletion((prev) => new Map(prev).set(habitId, !prev.get(habitId)))
      await window.api.habit.toggleHabitCompleted(habitId, date)
      await loadHabitState()
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
    <ul className="divide-y divide-ink/10 max-h-[200px] overflow-y-auto no-scrollbar">
      {habits.map((habit) => {
        const completedToday = habitCompletion.get(habit.id) ?? false
        // Backend counts back from (entryDate - 1) and excludes the current
        // entry. Add 1 when the entry itself is completed so the displayed
        // streak reflects the visible state.
        const streak = (habitStreaks.get(habit.id) ?? 0) + (completedToday ? 1 : 0)
        return (
          <li key={habit.id}>
            <label className="flex items-center gap-3 py-2 cursor-pointer rounded px-1 -mx-1 hover:bg-ink/[0.04]">
              <span
                className="h-3 w-3 rounded-full flex-none ring-1 ring-black/10"
                style={{ backgroundColor: habit.color }}
                aria-hidden
              />
              <span className="font-serif text-ink text-sm flex-1">{habit.name}</span>
              {streak > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 font-serif text-rust text-xs font-medium tabular-nums"
                  aria-label={`${streak} day streak`}
                  title={`${streak} day streak`}
                >
                  <Flame className="w-3 h-3" strokeWidth={2.25} />
                  {streak}
                </span>
              )}
              <input
                type="checkbox"
                checked={habitCompletion.get(habit.id) ?? false}
                onChange={() => handleToggleHabit(habit.id, entryDate)}
                className="w-4 h-4 accent-ink cursor-pointer"
                aria-label={habit.name}
              />
            </label>
          </li>
        )
      })}
    </ul>
  )
}

export default HabitTrackerWidget
