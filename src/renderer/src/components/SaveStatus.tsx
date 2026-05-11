import { useCallback, useState, ReactNode } from 'react'
import { SaveStatusContext } from '@renderer/utils/saveStatus'

export function SaveStatusProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const markSaved = useCallback(() => setLastSavedAt(new Date()), [])
  return (
    <SaveStatusContext.Provider value={{ lastSavedAt, markSaved }}>
      {children}
    </SaveStatusContext.Provider>
  )
}
