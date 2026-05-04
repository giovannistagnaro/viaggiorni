import SectionEditor from '@renderer/components/SectionEditor'
import WidgetRenderer from '@renderer/components/WidgetRenderer'
import { formatDateISO, formatTitleForDate } from '@renderer/utils/dateFormatters'
import { Entry, EntrySection, EntryWidget } from '@shared/types'
import { useEffect, useState } from 'react'

interface Props {
  onLock: () => void
}

function Main({ onLock }: Props): React.JSX.Element {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<EntrySection[]>([])
  const [widgets, setWidgets] = useState<EntryWidget[]>([])

  useEffect(() => {
    async function dateSetup(): Promise<void> {
      try {
        const isoDate = formatDateISO(new Date())
        let todayEntry = await window.api.entries.getByDate(isoDate)
        if (!todayEntry)
          todayEntry = await window.api.entries.create(isoDate, formatTitleForDate(isoDate))
        setEntry(todayEntry)
      } catch (err) {
        // TODO: surface to user via error UI
        console.error("Failed to load or create today's entry", err)
      } finally {
        setLoading(false)
      }
    }
    dateSetup()
  }, [])

  useEffect(() => {
    async function entrySectionSetup(): Promise<void> {
      if (!entry) return
      try {
        const entrySections = await window.api.entrySections.getSectionsForEntry(entry.id)
        setSections(entrySections)
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to load entry sections', err)
      }
    }
    entrySectionSetup()
  }, [entry])

  useEffect(() => {
    async function entryWidgetSetup(): Promise<void> {
      if (!entry) return
      try {
        const entryWidgets = await window.api.entryWidgets.getWidgetsForEntry(entry.id)
        setWidgets(entryWidgets)
      } catch (err) {
        console.error('Failed to load widgets', err)
      }
    }
    entryWidgetSetup()
  }, [entry])

  async function handleTitleBlur(newTitle: string): Promise<void> {
    if (!entry || entry.title === newTitle) return
    try {
      await window.api.entries.updateTitle(entry.id, newTitle)
      setEntry({ ...entry, title: newTitle })
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to update entry title', err)
    }
  }

  async function handleLock(): Promise<void> {
    ;(document.activeElement as HTMLElement | null)?.blur()
    // give pending IPC a tick to complete
    await new Promise((r) => setTimeout(r, 0))
    try {
      await window.api.db.close()
    } catch (err) {
      console.error('Failed to close DB', err)
    }
    onLock()
  }

  if (loading) return <div>Loading...</div>
  if (!entry) return <div>Failed to load entry</div>

  return (
    <>
      <button
        className="fixed top-4 right-4 rounded-lg bg-gray-600 text-white px-4 py-2"
        onClick={handleLock}
        type="button"
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
        <div>
          {widgets.map((widget) => (
            <WidgetRenderer key={widget.id} widget={widget} entryDate={entry.date} />
          ))}
        </div>
        <div>
          {sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onSave={async (newContent) => {
                try {
                  await window.api.entrySections.updateSectionContent(section.id, newContent)
                } catch (err) {
                  // TODO: surface to user via error UI
                  console.error('Failed to save section content', err)
                }
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default Main
