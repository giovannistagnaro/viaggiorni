import { Habit, HabitLog } from '@shared/types'
import { DrizzleDB } from '../database'
import { habits, habitLogs, habitPauses } from '../schema'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'

export function getActiveHabits(db: DrizzleDB): Habit[] {
  return db
    .select()
    .from(habits)
    .where(eq(habits.isArchived, false))
    .orderBy(asc(habits.createdAt))
    .all()
}

export function createHabit(db: DrizzleDB, name: string, color: string): Habit | null {
  return db.transaction((tx) => {
    const existingHabit = tx.select().from(habits).where(eq(habits.name, name)).get()

    if (!existingHabit) return tx.insert(habits).values({ name, color }).returning().get()

    if (existingHabit.isArchived) {
      tx.update(habits)
        .set({ isArchived: false, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(habits.id, existingHabit.id))
        .run()
      return tx.select().from(habits).where(eq(habits.name, name)).get() || null
    } else return null
  })
}

export function archiveHabit(db: DrizzleDB, habitId: number): void {
  // - update habits set isArchived = true, updatedAt = sql`(CURRENT_TIMESTAMP)` where id = habitId
  db.update(habits)
    .set({ isArchived: true, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(habits.id, habitId))
    .run()
}

export function unarchiveHabit(db: DrizzleDB, habitId: number): void {
  // - update habits set isArchived = false, updatedAt = sql`(CURRENT_TIMESTAMP)` where id = habitId
  db.update(habits)
    .set({ isArchived: false, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(habits.id, habitId))
    .run()
}

export function updateHabit(db: DrizzleDB, habitId: number, name: string, color: string): void {
  db.update(habits)
    .set({ name, color, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(habits.id, habitId))
    .run()
}

export function getHabitLogForDate(db: DrizzleDB, habitId: number, date: string): HabitLog | null {
  const log = db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.entryDate, date)))
    .get()

  if (!log) return null
  return log
}

export function toggleHabitCompleted(db: DrizzleDB, habitId: number, date: string): void {
  db.transaction((tx) => {
    const log = tx
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.entryDate, date)))
      .get()

    if (!log) tx.insert(habitLogs).values({ habitId, entryDate: date, completed: true }).run()
    else
      tx.update(habitLogs)
        .set({ completed: !log.completed })
        .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.entryDate, date)))
        .run()
  })
}

export function pauseHabit(db: DrizzleDB, habitId: number, startDate: string): void {
  db.insert(habitPauses).values({ habitId, startDate }).run()
}

export function resumeHabit(db: DrizzleDB, habitId: number, endDate: string): void {
  db.update(habitPauses)
    .set({ endDate })
    .where(and(eq(habitPauses.habitId, habitId), isNull(habitPauses.endDate)))
    .run()
}

export function calculateStreak(
  db: DrizzleDB,
  habitId: number,
  today: string,
  tolerance: number
): number {
  return db.transaction((tx) => {
    const logs = tx.select().from(habitLogs).where(eq(habitLogs.habitId, habitId)).all()
    const pauses = tx.select().from(habitPauses).where(eq(habitPauses.habitId, habitId)).all()

    const dateToCompletionStatus = new Map<string, boolean>(
      logs.map((log) => [log.entryDate, log.completed])
    )

    const habitCreationDate = tx
      .select({ createdAt: habits.createdAt })
      .from(habits)
      .where(eq(habits.id, habitId))
      .get()

    if (!habitCreationDate) return 0

    let previousDay = addDays(today, -1)
    let streak = 0
    let remainingTolerance = tolerance

    // only search back to when the habit was created initially
    while (atMostCreationDate(previousDay, habitCreationDate.createdAt)) {
      if (isInPause(previousDay, pauses)) {
        previousDay = addDays(previousDay, -1)
        continue
      } else if (dateToCompletionStatus.get(previousDay)) streak++
      else {
        if (--remainingTolerance < 0) break
      }
      previousDay = addDays(previousDay, -1)
    }

    return streak
  })
}

function atMostCreationDate(isoDate: string, creationTimestamp: string): boolean {
  return isoDate >= creationTimestamp.substring(0, 10)
}

// helper — add (or subtract with negative) days to an ISO YYYY-MM-DD date
function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

// helper — is `date` (YYYY-MM-DD) inside any pause range?
// a pause covers [startDate, endDate]; endDate=null means open-ended (still paused)
function isInPause(date: string, pauses: { startDate: string; endDate: string | null }[]): boolean {
  return pauses.some((p) => p.startDate <= date && (p.endDate === null || date <= p.endDate))
}
