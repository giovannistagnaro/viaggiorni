import { Calendar } from '@renderer/components/ui/calendar'
import { formatDateISO } from '@renderer/utils/dateFormatters'
import { Entry } from '@shared/types'
import { useEffect, useState } from 'react'

interface Props {
  onNavigateToDay: (date: string) => void
}

function Index({ onNavigateToDay }: Props): React.JSX.Element {
  const [bookmarkedEntries, setBookmarkedEntries] = useState<Entry[]>([])
  const [entryDates, setEntryDates] = useState<string[]>([])

  function navigateRelativeToToday(daysBack: number): void {
    const target = new Date()
    target.setDate(target.getDate() - daysBack)
    onNavigateToDay(formatDateISO(target))
  }

  useEffect(() => {
    let cancelled = false
    async function getEntryData(): Promise<void> {
      try {
        const bookmarkedEntries = await window.api.entries.getAllBookmarked()
        const dates = await window.api.entries.getAllDates()
        if (!cancelled) {
          setEntryDates(dates)
          setBookmarkedEntries(bookmarkedEntries)
        }
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to fetch bookmarked entries', err)
      }
    }
    getEntryData()
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <div className="grid grid-cols-2 grid-rows-1 gap-4">
      <div>
        <Calendar
          mode="single"
          onSelect={(d) => d && onNavigateToDay(d.toLocaleDateString('en-CA'))}
          className="rounded-lg border w-full"
          captionLayout="dropdown"
          disabled={{ after: new Date() }}
          modifiers={{
            hasEntry: entryDates.map((d) => new Date(d + 'T00:00:00')),
            hasBookmark: bookmarkedEntries.map((e) => new Date(e.date + 'T00:00:00'))
          }}
          modifiersClassNames={{
            hasEntry: 'has-entry-indicator',
            hasBookmark: 'has-bookmark-indicator'
          }}
        />
        <div className="space-x-2">
          <button onClick={() => navigateRelativeToToday(0)}>Today</button>
          <button onClick={() => navigateRelativeToToday(1)}>Yesterday</button>
        </div>
      </div>
      <div>
        {bookmarkedEntries.map((entry) => {
          return (
            <div key={entry.id}>
              <button onClick={() => onNavigateToDay(entry.date)}>
                <h2>
                  {entry.date} - {entry.title}
                </h2>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Index
