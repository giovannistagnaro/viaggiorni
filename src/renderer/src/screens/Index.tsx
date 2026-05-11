import { Calendar } from '@renderer/components/ui/calendar'
import { Button } from '@renderer/components/ui/button'
import JournalSpread from '@renderer/components/JournalSpread'
import { formatDateISO } from '@renderer/utils/dateFormatters'
import { Entry } from '@shared/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const LARGE_STENCILS = Object.values(
  import.meta.glob('@renderer/assets/stencils/large/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

interface Props {
  onNavigateToDay: (date: string) => void
}

function formatShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function Index({ onNavigateToDay }: Props): React.JSX.Element {
  const [bookmarkedEntries, setBookmarkedEntries] = useState<Entry[]>([])
  const [entryDates, setEntryDates] = useState<string[]>([])
  // Re-roll the decorative stencil each time Index mounts (i.e. each time the
  // user opens the screen). Lazy initializer = one pick per mount.
  const [stencilUrl] = useState<string>(
    () => LARGE_STENCILS[Math.floor(Math.random() * LARGE_STENCILS.length)]
  )

  function navigateRelativeToToday(daysBack: number): void {
    const target = new Date()
    target.setDate(target.getDate() - daysBack)
    onNavigateToDay(formatDateISO(target))
  }

  useEffect(() => {
    let cancelled = false
    async function getEntryData(): Promise<void> {
      try {
        const bookmarked = await window.api.entries.getAllBookmarked()
        const dates = await window.api.entries.getAllDates()
        if (!cancelled) {
          setEntryDates(dates)
          setBookmarkedEntries(bookmarked)
        }
      } catch (err) {
        console.error('Failed to fetch bookmarked entries', err)
        toast.error('Failed to fetch bookmarked entries')
      }
    }
    getEntryData()
    return () => {
      cancelled = true
    }
  }, [])

  const leftPage = (
    <div className="flex flex-col items-center gap-4">
      <Calendar
        mode="single"
        onSelect={(d) => d && onNavigateToDay(d.toLocaleDateString('en-CA'))}
        className="bg-transparent w-full text-base"
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateRelativeToToday(0)}
          className="font-serif text-ink-soft hover:text-ink hover:bg-ink/5"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateRelativeToToday(1)}
          className="font-serif text-ink-soft hover:text-ink hover:bg-ink/5"
        >
          Yesterday
        </Button>
      </div>
    </div>
  )

  const rightPage = (
    <div className="p-8">
      <h2 className="font-serif text-ink text-xs uppercase tracking-[0.18em] font-semibold">
        Bookmarks
      </h2>
      <div className="h-px bg-ink/15 mt-1 mb-3" />
      {bookmarkedEntries.length === 0 ? (
        <p className="font-serif text-ink-soft text-sm italic">
          No bookmarks yet — bookmark days from the journal to find them here.
        </p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {bookmarkedEntries.map((entry) => (
            <li key={entry.id}>
              <Button
                variant="ghost"
                onClick={() => onNavigateToDay(entry.date)}
                className="group w-full justify-start text-left h-auto py-2 px-1 -mx-1 rounded hover:bg-ink/[0.04] gap-3 whitespace-normal"
              >
                <span className="font-serif text-[11px] uppercase tracking-wider text-ink-soft flex-none w-[6.5em]">
                  {formatShortDate(entry.date)}
                </span>
                <span className="font-serif text-sm text-ink flex-1 group-hover:underline decoration-dotted underline-offset-2">
                  {entry.title}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <main className="flex-1 grid">
      <JournalSpread
        left={leftPage}
        right={rightPage}
        rightDecoration={
          <img
            src={stencilUrl}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute bottom-2 right-2 select-none pointer-events-none max-w-[55%] h-auto opacity-70"
            style={{ transform: 'rotate(2deg)' }}
          />
        }
      />
    </main>
  )
}

export default Index
