import WritingEditor from '@renderer/components/WritingEditor'
import WidgetRenderer from '@renderer/components/WidgetRenderer'
import JournalSpread from '@renderer/components/JournalSpread'
import BookmarkTab from '@renderer/components/BookmarkTab'
import EntryHeader from '@renderer/components/EntryHeader'
import { useSaveStatus } from '@renderer/utils/saveStatus'
import { pickByDate } from '@renderer/utils/pickByDate'
import { formatTitleForDate } from '@renderer/utils/dateFormatters'
import { Entry, EntryWriting, EntryWidget, WidgetType, WritingType } from '@shared/types'
import { WIDGET_TYPES, WRITING_TYPES, WRITING_TYPE_LABELS } from '@shared/constants'

const LARGE_STENCILS = Object.values(
  import.meta.glob('@renderer/assets/stencils/large/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

// Prefer postage; passport as a fallback. Pulled into one list to keep the
// hash distribution simple — postage is 4x more numerous so it dominates.
const POSTAGE_STAMPS = Object.values(
  import.meta.glob('@renderer/assets/stamps/postage_stamps/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]
const PASSPORT_STAMPS = Object.values(
  import.meta.glob('@renderer/assets/stamps/passport_stamps/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]
const STAMP_ROTATIONS = [-14, -10, -6, -3, 3, 6, 10, 14]
import { useEffect, useState } from 'react'
import { addDays } from '@shared/helpers'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'

interface Props {
  entryDate: string
  onNavigateToDay: (date: string) => void
  today: string
  editMode: boolean
  onSetEditMode: (next: boolean) => void
}
function Day({
  entryDate,
  onNavigateToDay,
  today,
  editMode,
  onSetEditMode
}: Props): React.JSX.Element {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [writings, setWritings] = useState<EntryWriting[]>([])
  const [widgets, setWidgets] = useState<EntryWidget[]>([])
  const [rightNavAvailable, setRightNavAvailable] = useState<boolean>(false)
  const setEditMode = onSetEditMode
  const { markSaved } = useSaveStatus()

  useHotkeys('mod+right', () => (rightNavAvailable ? onNavigateToDay(addDays(entryDate, 1)) : {}))
  useHotkeys('mod+left', () => onNavigateToDay(addDays(entryDate, -1)))
  useHotkeys('mod+b', () => handleBookmark())
  useHotkeys('esc', () => (editMode ? setEditMode(false) : {}))

  useEffect(() => {
    async function dateSetup(): Promise<void> {
      try {
        let todayEntry = await window.api.entries.getByDate(entryDate)
        if (!todayEntry)
          todayEntry = await window.api.entries.create(entryDate, formatTitleForDate(entryDate))
        setEntry(todayEntry)
        setRightNavAvailable(entryDate < today)
      } catch (err) {
        console.error("Failed to load or create today's entry", err)
        toast.error("Failed to load or create today's entry")
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
        console.error('Failed to load entry writings', err)
        toast.error('Failed to load entry writings')
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
        toast.error('Failed to load widgets')
      }
    }
    entryWidgetSetup()
  }, [entry])

  async function handleTitleBlur(newTitle: string): Promise<void> {
    if (!entry || entry.title === newTitle) return
    try {
      await window.api.entries.updateTitle(entry.id, newTitle)
      setEntry({ ...entry, title: newTitle })
      markSaved()
    } catch (err) {
      console.error('Failed to update entry title', err)
      toast.error('Failed to update entry title')
    }
  }

  async function handleBookmark(): Promise<void> {
    if (!entry) return
    try {
      await window.api.entries.toggleBookmark(entry.id)
      setEntry({ ...entry, isBookmarked: !entry.isBookmarked })
      markSaved()
    } catch (err) {
      console.error('Failed to bookmark entry', err)
      toast.error('Failed to bookmark entry')
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
      markSaved()
    } catch (err) {
      console.error('Failed to refresh entry structure', err)
      toast.error('Failed to refresh entry structure')
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
      console.error('Failed to change widget position', err)
      toast.error('Failed to change widget position')
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
      console.error('Failed to change writing position', err)
      toast.error('Failed to change writing position')
    }
  }

  async function handleWidgetVisibility(widgetId: number, isVisible: boolean): Promise<void> {
    try {
      await window.api.entryWidgets.setVisibility(widgetId, isVisible)
      await refreshStructure()
    } catch (err) {
      console.error('Failed to set widget visibility', err)
      toast.error('Failed to set widget visibility')
    }
  }

  async function handleWritingVisibility(writingId: number, isVisible: boolean): Promise<void> {
    try {
      await window.api.entryWritings.setVisibility(writingId, isVisible)
      await refreshStructure()
    } catch (err) {
      console.error('Failed to set writing visibility', err)
      toast.error('Failed to set writing visibility')
    }
  }

  async function handleWidgetAdd(type: WidgetType): Promise<void> {
    if (!entry) return
    try {
      await window.api.entryWidgets.addEntryWidget(entry.id, type)
      await refreshStructure()
    } catch (err) {
      console.error('Failed to add widget to entry', err)
      toast.error('Failed to add widget to entry')
    }
  }

  async function handleWritingAdd(type: WritingType): Promise<void> {
    if (!entry) return
    try {
      await window.api.entryWritings.addEntryWriting(entry.id, type, WRITING_TYPE_LABELS[type])
      await refreshStructure()
    } catch (err) {
      console.error('Failed to add writing to entry', err)
      toast.error('Failed to add writing to entry')
    }
  }

  async function handleWidgetColSpan(widgetId: number, colSpan: number): Promise<void> {
    try {
      await window.api.entryWidgets.updateColSpan(widgetId, colSpan)
      await refreshStructure()
    } catch (err) {
      console.error('Failed to update widget colSpan', err)
      toast.error('Failed to update widget colSpan')
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

  const bottomStencilUrl = pickByDate(entry.date, 'right-page-stencil', LARGE_STENCILS)

  type GridItem =
    | { kind: 'widget'; widget: EntryWidget }
    | { kind: 'stamp'; colSpan: number; slot: number }
  const gridItems: GridItem[] = []
  let usedInRow = 0
  let stampSlot = 0
  for (const widget of visibleWidgets) {
    if (usedInRow + widget.colSpan > 4) {
      gridItems.push({ kind: 'stamp', colSpan: 4 - usedInRow, slot: stampSlot++ })
      usedInRow = widget.colSpan
    } else {
      usedInRow += widget.colSpan
    }
    gridItems.push({ kind: 'widget', widget })
    if (usedInRow === 4) usedInRow = 0
  }
  if (usedInRow > 0 && usedInRow < 4) {
    gridItems.push({ kind: 'stamp', colSpan: 4 - usedInRow, slot: stampSlot++ })
  }

  const leftPage = (
    <div>
      <EntryHeader title={entry.title} entryDate={entry.date} onTitleBlur={handleTitleBlur} />

      <div className={editMode ? 'mt-6' : 'mt-6 grid grid-cols-4 gap-4'}>
        {editMode
          ? visibleWidgets.map((widget) => (
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
            ))
          : gridItems.map((item) =>
              item.kind === 'widget' ? (
                <div key={item.widget.id} style={{ gridColumn: `span ${item.widget.colSpan}` }}>
                  <WidgetRenderer widget={item.widget} entryDate={entry.date} />
                </div>
              ) : (
                <div
                  key={`stamp-${item.slot}`}
                  className="flex items-center justify-center"
                  style={{ gridColumn: `span ${item.colSpan}` }}
                >
                  <img
                    src={pickByDate(
                      entry.date,
                      `stamp-${item.slot}`,
                      // Slot 0 = postage (preferred); subsequent slots alternate
                      // so multiple stamps on a page diversify.
                      item.slot % 2 === 0 ? POSTAGE_STAMPS : PASSPORT_STAMPS
                    )}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="pointer-events-none select-none max-h-[180px] w-auto"
                    style={{
                      transform: `rotate(${pickByDate(entry.date, `stamp-rot-${item.slot}`, STAMP_ROTATIONS)}deg)`,
                      opacity: 0.78,
                      mixBlendMode: 'multiply'
                    }}
                  />
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
    </div>
  )

  const rightPage = (
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
                markSaved()
              } catch (err) {
                console.error('Failed to save writing content', err)
                toast.error('Failed to save writing content')
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
  )

  const monthLabel = new Date(entryDate + 'T00:00:00').toLocaleString('en-US', { month: 'long' })

  return (
    <JournalSpread
      left={leftPage}
      right={rightPage}
      rightDecoration={
        <img
          src={bottomStencilUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute bottom-2 right-2 select-none pointer-events-none max-w-[55%] h-auto opacity-70"
          style={{ transform: 'rotate(2deg)' }}
        />
      }
      bookmarkTab={
        <BookmarkTab
          label={monthLabel}
          isBookmarked={entry.isBookmarked}
          onClick={handleBookmark}
        />
      }
      leftEdge={
        <button
          onClick={() => onNavigateToDay(addDays(entryDate, -1))}
          className="text-paper/70 hover:text-paper text-2xl font-serif"
          aria-label="Previous day"
        >
          {'‹'}
        </button>
      }
      rightEdge={
        rightNavAvailable ? (
          <button
            onClick={() => onNavigateToDay(addDays(entryDate, 1))}
            className="text-paper/70 hover:text-paper text-2xl font-serif"
            aria-label="Next day"
          >
            {'›'}
          </button>
        ) : null
      }
    />
  )
}

export default Day
