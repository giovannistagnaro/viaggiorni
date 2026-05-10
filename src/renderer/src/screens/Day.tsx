import WritingEditor from '@renderer/components/WritingEditor'
import WidgetRenderer from '@renderer/components/WidgetRenderer'
import { formatTitleForDate } from '@renderer/utils/dateFormatters'
import { Entry, EntryWriting, EntryWidget, WidgetType, WritingType } from '@shared/types'
import { WIDGET_TYPES, WRITING_TYPES, WRITING_TYPE_LABELS } from '@shared/constants'
import { useEffect, useState } from 'react'
import { addDays } from '@shared/helpers'

interface Props {
  entryDate: string
  onNavigateToDay: (date: string) => void
  today: string
}
function Day({ entryDate, onNavigateToDay, today }: Props): React.JSX.Element {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [writings, setWritings] = useState<EntryWriting[]>([])
  const [widgets, setWidgets] = useState<EntryWidget[]>([])
  const [editMode, setEditMode] = useState<boolean>(false)
  const [rightNavAvailable, setRightNavAvailable] = useState<boolean>(false)

  useEffect(() => {
    async function dateSetup(): Promise<void> {
      try {
        let todayEntry = await window.api.entries.getByDate(entryDate)
        if (!todayEntry)
          todayEntry = await window.api.entries.create(entryDate, formatTitleForDate(entryDate))
        setEntry(todayEntry)
        setRightNavAvailable(entryDate < today)
      } catch (err) {
        // TODO: surface to user via error UI
        console.error("Failed to load or create today's entry", err)
      } finally {
        setLoading(false)
      }
    }
    dateSetup()
  }, [entryDate, today])

  useEffect(() => {
    async function entryWritingSetup(): Promise<void> {
      if (!entry) return
      try {
        const entryWritings = await window.api.entryWritings.getWritingsForEntry(entry.id)
        setWritings(entryWritings)
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to load entry writings', err)
      }
    }
    entryWritingSetup()
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

  async function handleBookmark(): Promise<void> {
    if (!entry) return
    try {
      await window.api.entries.toggleBookmark(entry.id)
      setEntry({ ...entry, isBookmarked: !entry.isBookmarked })
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to bookmark entry', err)
    }
  }

  async function refreshStructure(): Promise<void> {
    if (!entry) return
    try {
      const [refreshedWidgets, refreshedWritings] = await Promise.all([
        window.api.entryWidgets.getWidgetsForEntry(entry.id),
        window.api.entryWritings.getWritingsForEntry(entry.id)
      ])
      setWidgets(refreshedWidgets)
      setWritings(refreshedWritings)
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to refresh entry structure', err)
    }
  }

  async function handleWidgetMove(
    widgetId: number,
    position: number,
    direction: 1 | -1
  ): Promise<void> {
    try {
      await window.api.entryWidgets.changePosition(widgetId, position + direction)
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to change widget position', err)
    }
  }

  async function handleWritingMove(
    writingId: number,
    position: number,
    direction: 1 | -1
  ): Promise<void> {
    try {
      await window.api.entryWritings.changePosition(writingId, position + direction)
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to change writing position', err)
    }
  }

  async function handleWidgetVisibility(widgetId: number, isVisible: boolean): Promise<void> {
    try {
      await window.api.entryWidgets.setVisibility(widgetId, isVisible)
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to set widget visibility', err)
    }
  }

  async function handleWritingVisibility(writingId: number, isVisible: boolean): Promise<void> {
    try {
      await window.api.entryWritings.setVisibility(writingId, isVisible)
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to set writing visibility', err)
    }
  }

  async function handleWidgetAdd(type: WidgetType): Promise<void> {
    if (!entry) return
    try {
      await window.api.entryWidgets.addEntryWidget(entry.id, type)
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to add widget to entry', err)
    }
  }

  async function handleWritingAdd(type: WritingType): Promise<void> {
    if (!entry) return
    try {
      await window.api.entryWritings.addEntryWriting(entry.id, type, WRITING_TYPE_LABELS[type])
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to add writing to entry', err)
    }
  }

  async function handleWidgetColSpan(widgetId: number, colSpan: number): Promise<void> {
    try {
      await window.api.entryWidgets.updateColSpan(widgetId, colSpan)
      await refreshStructure()
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to update widget colSpan', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!entry) return <div>Failed to load entry</div>

  const visibleWidgets = editMode ? widgets : widgets.filter((w) => w.isVisible)
  const visibleWritings = editMode ? writings : writings.filter((w) => w.isVisible)

  const usedWidgetTypes = new Set(widgets.map((w) => w.type))
  const availableWidgetTypes = WIDGET_TYPES.filter((t) => !usedWidgetTypes.has(t))

  const usedWritingTypes = new Set(writings.map((w) => w.type))
  const availableWritingTypes = WRITING_TYPES.filter(
    (t) => t !== 'custom' && !usedWritingTypes.has(t)
  )

  return (
    <div className="grid grid-cols-[auto_1fr_auto] h-full">
      <button onClick={() => onNavigateToDay(addDays(entryDate, -1))} className="self-center">
        {'<'}
      </button>
      <div>
        <div>
          <input
            type="text"
            defaultValue={entry.title}
            onBlur={(e) => handleTitleBlur(e.target.value)}
            placeholder={'Enter entry title...'}
          />
          <button onClick={() => setEditMode(!editMode)}>{editMode ? 'Done' : 'Edit'}</button>
        </div>
        <p>{entry.date}</p>
        <button onClick={handleBookmark}>{entry.isBookmarked ? 'Un-bookmark' : 'Bookmark'}</button>

        <div className="grid grid-cols-2 grid-rows-1 gap-4">
          <div className={editMode ? '' : 'grid grid-cols-4 gap-4'}>
            {visibleWidgets.map((widget) =>
              editMode ? (
                <div key={widget.id} className="grid grid-cols-5 items-center gap-2">
                  <span>{widget.type}</span>
                  <button onClick={() => handleWidgetMove(widget.id, widget.position, -1)}>
                    [Up]
                  </button>
                  <button onClick={() => handleWidgetMove(widget.id, widget.position, 1)}>
                    [Down]
                  </button>
                  <button onClick={() => handleWidgetVisibility(widget.id, !widget.isVisible)}>
                    {widget.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <select
                    value={widget.colSpan}
                    onChange={(e) => handleWidgetColSpan(widget.id, Number(e.target.value))}
                  >
                    <option value={2}>Half</option>
                    <option value={4}>Full</option>
                  </select>
                </div>
              ) : (
                <div key={widget.id} style={{ gridColumn: `span ${widget.colSpan}` }}>
                  <WidgetRenderer widget={widget} entryDate={entry.date} />
                </div>
              )
            )}
            {editMode && availableWidgetTypes.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleWidgetAdd(e.target.value as WidgetType)
                }}
              >
                <option value="" disabled>
                  [+] Add widget
                </option>
                {availableWidgetTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            {visibleWritings.map((writing) =>
              editMode ? (
                <div key={writing.id} className="grid grid-cols-4 items-center gap-2">
                  <span>{writing.label ?? writing.type}</span>
                  <button onClick={() => handleWritingMove(writing.id, writing.position, -1)}>
                    [Up]
                  </button>
                  <button onClick={() => handleWritingMove(writing.id, writing.position, 1)}>
                    [Down]
                  </button>
                  <button onClick={() => handleWritingVisibility(writing.id, !writing.isVisible)}>
                    {writing.isVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              ) : (
                <WritingEditor
                  key={writing.id}
                  writing={writing}
                  entryDate={entry.date}
                  onSave={async (newContent) => {
                    try {
                      await window.api.entryWritings.updateWritingContent(writing.id, newContent)
                    } catch (err) {
                      // TODO: surface to user via error UI
                      console.error('Failed to save writing content', err)
                    }
                  }}
                />
              )
            )}
            {editMode && availableWritingTypes.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleWritingAdd(e.target.value as WritingType)
                }}
              >
                <option value="" disabled>
                  [+] Add writing
                </option>
                {availableWritingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      {rightNavAvailable && (
        <button onClick={() => onNavigateToDay(addDays(entryDate, 1))} className="self-center">
          {'>'}
        </button>
      )}
    </div>
  )
}

export default Day
