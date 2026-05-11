import { createContext, useContext, useEffect, useState } from 'react'

export interface SaveStatusValue {
  lastSavedAt: Date | null
  markSaved: () => void
}

export const SaveStatusContext = createContext<SaveStatusValue | null>(null)

const NULL_SAVE_STATUS: SaveStatusValue = { lastSavedAt: null, markSaved: () => undefined }

export function useSaveStatus(): SaveStatusValue {
  return useContext(SaveStatusContext) ?? NULL_SAVE_STATUS
}

export function formatSavedAgo(savedAt: Date | null, now: Date = new Date()): string | null {
  if (!savedAt) return null
  const diffSec = Math.max(0, Math.floor((now.getTime() - savedAt.getTime()) / 1000))
  if (diffSec < 5) return 'Saved just now'
  if (diffSec < 60) return `Saved ${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Saved ${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Saved ${diffHr}h ago`
  return `Saved ${savedAt.toLocaleDateString()}`
}

export function useNowTick(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
