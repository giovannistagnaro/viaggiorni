import { DrizzleDB } from '../database'
import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { closeTestDb, createTestDb } from './testHelper'
import { habits, habitLogs, habitPauses } from '../schema'
import { eq } from 'drizzle-orm'
import {
  createHabit,
  getActiveHabits,
  archiveHabit,
  unarchiveHabit,
  updateHabit,
  getHabitLogForDate,
  toggleHabitCompleted,
  pauseHabit,
  resumeHabit,
  calculateStreak
} from './habits'
import { Habit } from '@shared/types'

const TODAY = '2026-05-04'

let db: DrizzleDB

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

// Inserts a habit with a controlled createdAt
function insertHabit(
  db: DrizzleDB,
  name = 'Test Habit',
  color = '#ff0000',
  createdAt = '2020-01-01 00:00:00'
): Habit {
  return db.insert(habits).values({ name, color, isArchived: false, createdAt }).returning().get()
}

function logCompleted(db: DrizzleDB, habitId: number, date: string): void {
  db.insert(habitLogs).values({ habitId, entryDate: date, completed: true }).run()
}

function logMissed(db: DrizzleDB, habitId: number, date: string): void {
  db.insert(habitLogs).values({ habitId, entryDate: date, completed: false }).run()
}

function addPause(db: DrizzleDB, habitId: number, startDate: string, endDate?: string): void {
  db.insert(habitPauses)
    .values({ habitId, startDate, ...(endDate ? { endDate } : {}) })
    .run()
}

describe('createHabit', () => {
  it('returns a habit with the correct name and color', () => {
    const habit = createHabit(db, 'Running', '#ff0000')
    expect(habit?.name).toBe('Running')
    expect(habit?.color).toBe('#ff0000')
  })

  it('returns null when an active habit with the same name already exists', () => {
    createHabit(db, 'Running', '#ff0000')
    const duplicate = createHabit(db, 'Running', '#00ff00')
    expect(duplicate).toBeNull()
  })

  it('unarchives the existing habit when an archived habit with the same name exists', () => {
    const original = createHabit(db, 'Running', '#ff0000')!
    archiveHabit(db, original.id)
    const result = createHabit(db, 'Running', '#0000ff')
    expect(result).not.toBeNull()
    expect(result?.isArchived).toBe(false)
  })
})

describe('getActiveHabits', () => {
  it('returns an empty array when no habits exist', () => {
    expect(getActiveHabits(db)).toEqual([])
  })

  it('excludes archived habits', () => {
    const habit = createHabit(db, 'Running', '#ff0000')!
    archiveHabit(db, habit.id)
    expect(getActiveHabits(db)).toEqual([])
  })

  it('returns only non-archived habits when both exist', () => {
    const active = createHabit(db, 'Running', '#ff0000')!
    const archived = createHabit(db, 'Cycling', '#00ff00')!
    archiveHabit(db, archived.id)
    const result = getActiveHabits(db)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(active.id)
  })

  it('orders habits by createdAt ascending', () => {
    insertHabit(db, 'First', '#ff0000', '2024-01-01 00:00:00')
    insertHabit(db, 'Second', '#00ff00', '2024-06-01 00:00:00')
    insertHabit(db, 'Third', '#0000ff', '2025-01-01 00:00:00')
    const result = getActiveHabits(db)
    expect(result.map((h) => h.name)).toEqual(['First', 'Second', 'Third'])
  })
})

describe('archiveHabit', () => {
  it('sets isArchived to true on the specified habit', () => {
    const habit = createHabit(db, 'Running', '#ff0000')!
    archiveHabit(db, habit.id)
    const result = db.select().from(habits).where(eq(habits.id, habit.id)).get()
    expect(result?.isArchived).toBe(true)
  })

  it('does not archive other habits', () => {
    const habitA = createHabit(db, 'Running', '#ff0000')!
    const habitB = createHabit(db, 'Cycling', '#00ff00')!
    archiveHabit(db, habitA.id)
    const result = db.select().from(habits).where(eq(habits.id, habitB.id)).get()
    expect(result?.isArchived).toBe(false)
  })
})

describe('unarchiveHabit', () => {
  it('sets isArchived to false on the specified habit', () => {
    const habit = createHabit(db, 'Running', '#ff0000')!
    archiveHabit(db, habit.id)
    unarchiveHabit(db, habit.id)
    const result = db.select().from(habits).where(eq(habits.id, habit.id)).get()
    expect(result?.isArchived).toBe(false)
  })
})

describe('updateHabit', () => {
  it('updates the name and color of the specified habit', () => {
    const habit = createHabit(db, 'Running', '#ff0000')!
    updateHabit(db, habit.id, 'Cycling', '#00ff00')
    const result = db.select().from(habits).where(eq(habits.id, habit.id)).get()
    expect(result?.name).toBe('Cycling')
    expect(result?.color).toBe('#00ff00')
  })

  it('updates the updatedAt timestamp', () => {
    const habit = createHabit(db, 'Running', '#ff0000')!
    updateHabit(db, habit.id, 'Cycling', '#00ff00')
    const result = db.select().from(habits).where(eq(habits.id, habit.id)).get()
    expect(result?.updatedAt).not.toBeNull()
  })
})

describe('getHabitLogForDate', () => {
  it('returns null when no log exists for that date', () => {
    const habit = insertHabit(db)
    expect(getHabitLogForDate(db, habit.id, '2026-05-01')).toBeNull()
  })

  it('returns the log matching the habit and date', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-01')
    const log = getHabitLogForDate(db, habit.id, '2026-05-01')
    expect(log?.habitId).toBe(habit.id)
    expect(log?.entryDate).toBe('2026-05-01')
  })

  it('does not return a log from a different habit on the same date', () => {
    const habitA = insertHabit(db, 'A')
    const habitB = insertHabit(db, 'B')
    logCompleted(db, habitB.id, '2026-05-01')
    expect(getHabitLogForDate(db, habitA.id, '2026-05-01')).toBeNull()
  })
})

describe('toggleHabitCompleted', () => {
  it('creates a completed log when no log exists for that date', () => {
    const habit = insertHabit(db)
    toggleHabitCompleted(db, habit.id, '2026-05-01')
    const log = getHabitLogForDate(db, habit.id, '2026-05-01')
    expect(log?.completed).toBe(true)
  })

  it('sets completed from true to false', () => {
    const habit = insertHabit(db)
    toggleHabitCompleted(db, habit.id, '2026-05-01')
    toggleHabitCompleted(db, habit.id, '2026-05-01')
    const log = getHabitLogForDate(db, habit.id, '2026-05-01')
    expect(log?.completed).toBe(false)
  })

  it('sets completed from false to true', () => {
    const habit = insertHabit(db)
    logMissed(db, habit.id, '2026-05-01')
    toggleHabitCompleted(db, habit.id, '2026-05-01')
    const log = getHabitLogForDate(db, habit.id, '2026-05-01')
    expect(log?.completed).toBe(true)
  })
})

describe('pauseHabit', () => {
  it('creates a pause row with the correct startDate and a null endDate', () => {
    const habit = insertHabit(db)
    pauseHabit(db, habit.id, '2026-05-01')
    const pause = db.select().from(habitPauses).where(eq(habitPauses.habitId, habit.id)).get()
    expect(pause?.startDate).toBe('2026-05-01')
    expect(pause?.endDate).toBeNull()
  })
})

describe('resumeHabit', () => {
  it('sets the endDate on the open pause for the correct habit', () => {
    const habit = insertHabit(db)
    pauseHabit(db, habit.id, '2026-04-01')
    resumeHabit(db, habit.id, '2026-05-01')
    const pause = db.select().from(habitPauses).where(eq(habitPauses.habitId, habit.id)).get()
    expect(pause?.endDate).toBe('2026-05-01')
  })

  it('does not close pauses belonging to other habits', () => {
    const habitA = insertHabit(db, 'A')
    const habitB = insertHabit(db, 'B')
    pauseHabit(db, habitA.id, '2026-04-01')
    pauseHabit(db, habitB.id, '2026-04-01')
    resumeHabit(db, habitA.id, '2026-05-01')
    const pauseB = db.select().from(habitPauses).where(eq(habitPauses.habitId, habitB.id)).get()
    expect(pauseB?.endDate).toBeNull()
  })
})

describe('calculateStreak', () => {
  it('returns 0 when no logs exist', () => {
    const habit = insertHabit(db)
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(0)
  })

  it('returns 0 when all logs have completed=false', () => {
    const habit = insertHabit(db)
    logMissed(db, habit.id, '2026-05-03')
    logMissed(db, habit.id, '2026-05-02')
    logMissed(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(0)
  })

  it('counts consecutive completed days correctly', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    logCompleted(db, habit.id, '2026-05-02')
    logCompleted(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(3)
  })

  it('tolerance=0: breaks on the first missed day', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    // 2026-05-02 missed
    logCompleted(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(1)
  })

  it('tolerance=0: a completed=false log counts as a missed day', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    logMissed(db, habit.id, '2026-05-02')
    logCompleted(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(1)
  })

  it('tolerance=1: one missed day does not break the streak', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    // 2026-05-02 missed — within tolerance
    logCompleted(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 1)).toBe(2)
  })

  it('tolerance=1: two consecutive missed days break the streak', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    // 2026-05-02 missed — uses tolerance
    // 2026-05-01 missed — exceeds tolerance
    logCompleted(db, habit.id, '2026-04-30')
    expect(calculateStreak(db, habit.id, TODAY, 1)).toBe(1)
  })

  it('tolerance=2: two missed days allowed, third breaks the streak', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    // 2026-05-02 missed — tolerance used
    // 2026-05-01 missed — tolerance used
    // 2026-04-30 missed — exceeds tolerance
    logCompleted(db, habit.id, '2026-04-29')
    expect(calculateStreak(db, habit.id, TODAY, 2)).toBe(1)
  })

  it('today missing does not reduce streak (grace day)', () => {
    const habit = insertHabit(db)
    // no log for TODAY
    logCompleted(db, habit.id, '2026-05-03')
    logCompleted(db, habit.id, '2026-05-02')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(2)
  })

  it('pause covering a missed day skips it and continues the streak', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    // 2026-05-02 missed but paused — skipped, not a miss
    addPause(db, habit.id, '2026-05-02', '2026-05-02')
    logCompleted(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(2)
  })

  it('pause covering a completed day skips it and does not add to streak', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    logCompleted(db, habit.id, '2026-05-02') // completed, but also paused
    addPause(db, habit.id, '2026-05-02', '2026-05-02')
    logCompleted(db, habit.id, '2026-05-01')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(2)
  })

  it('open pause skips all days from startDate through today', () => {
    const habit = insertHabit(db)
    addPause(db, habit.id, '2026-05-01') // open — no endDate
    logCompleted(db, habit.id, '2026-05-03') // within open pause — skipped
    logCompleted(db, habit.id, '2026-05-02') // within open pause — skipped
    logCompleted(db, habit.id, '2026-04-30') // before pause — counts
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(1)
  })

  it('multiple pauses are each handled correctly', () => {
    const habit = insertHabit(db)
    logCompleted(db, habit.id, '2026-05-03')
    addPause(db, habit.id, '2026-05-02', '2026-05-02')
    logCompleted(db, habit.id, '2026-05-01')
    addPause(db, habit.id, '2026-04-30', '2026-04-30')
    logCompleted(db, habit.id, '2026-04-29')
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(3)
  })

  it('stops lookback at the habit creation date', () => {
    // habit created on 2026-05-02 — May 1 is before creation and must not be reached
    const habit = insertHabit(db, 'Test', '#ff0000', '2026-05-02 00:00:00')
    logCompleted(db, habit.id, '2026-05-03')
    logCompleted(db, habit.id, '2026-05-02')
    logCompleted(db, habit.id, '2026-05-01') // before creation — must not count
    expect(calculateStreak(db, habit.id, TODAY, 0)).toBe(2)
  })
})
