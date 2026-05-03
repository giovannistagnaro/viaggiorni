import { useEffect, useState } from 'react'

interface Props {
  onLock: () => void
}

type Entry = {
  id: number
  title: string
  date: string
  isBookmarked: boolean
  createdAt: string
  updatedAt: string | null
}

function Main({ onLock }: Props): React.JSX.Element {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function dateSetup(): Promise<void> {
      const isoDate = formatDateISO(new Date())
      let todayEntry = await window.api.entries.getByDate(isoDate)
      if (!todayEntry)
        todayEntry = await window.api.entries.create(isoDate, formatTitleForDate(isoDate))
      setEntry(todayEntry)
      setLoading(false)
    }
    dateSetup()
  }, [])

  async function handleTitleBlur(newTitle: string): Promise<void> {
    if (!entry || entry.title === newTitle) return
    await window.api.entries.updateTitle(entry.id, newTitle)
    setEntry({ ...entry, title: newTitle })
  }

  async function handleLock(): Promise<void> {
    ;(document.activeElement as HTMLElement | null)?.blur()
    // give pending IPC a tick to complete
    await new Promise((r) => setTimeout(r, 0))
    await window.api.db.close()
    onLock()
  }

  if (loading) return <div>Loading...</div>
  if (!entry) return <div>Failed to load entry</div>

  return (
    <>
      <button
        className="fixed top-4 right-4 rounded-lg bg-gray-600 text-white px-4 py-2"
        onClick={handleLock}
      >
        Lock
      </button>
      <input
        type="text"
        defaultValue={entry.title}
        onBlur={(e) => handleTitleBlur(e.target.value)}
        placeholder={'Enter entry title...'}
      />
      <p>{entry.date}</p>

      <div className="grid grid-cols-2 grid-rows-1 gap-4">
        <p>Widgets (coming soon)</p>
        <p>Sections (coming soon)</p>
      </div>
    </>
  )
}

function formatDateISO(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

function formatTitleForDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

export default Main
