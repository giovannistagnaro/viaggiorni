import WritingEditor from '@renderer/components/WritingEditor'
import WidgetRenderer from '@renderer/components/WidgetRenderer'
import JournalSpread from '@renderer/components/JournalSpread'
import BookmarkTab from '@renderer/components/BookmarkTab'
import EntryHeader from '@renderer/components/EntryHeader'
import { useSaveStatus } from '@renderer/utils/saveStatus'
import { pickByDate } from '@renderer/utils/pickByDate'
import { formatTitleForDate } from '@renderer/utils/dateFormatters'
import { Entry, EntryWriting, EntryWidget, WidgetType, WritingType } from '@shared/types'
import {
  WIDGET_TYPES,
  WIDGET_TYPE_LABELS,
  WRITING_TYPES,
  WRITING_TYPE_LABELS
} from '@shared/constants'
import { Button } from '@renderer/components/ui/button'

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
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react'

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
          ? visibleWidgets.map((widget, idx) => (
              <div
                key={widget.id}
                className={`flex items-center gap-2 py-2 font-serif text-sm ${
                  idx === 0 ? '' : 'border-t border-ink/10'
                } ${widget.isVisible ? '' : 'opacity-50'}`}
              >
                <span className="text-ink font-medium flex-1 min-w-0 truncate">
                  {WIDGET_TYPE_LABELS[widget.type]}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleWidgetMove(widget.id, widget.position, -1)}
                  disabled={widget.position === 0}
                  aria-label={`Move ${widget.type} up`}
                  className="text-ink-soft hover:text-ink hover:bg-ink/5"
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleWidgetMove(widget.id, widget.position, 1)}
                  disabled={widget.position === visibleWidgets.length - 1}
                  aria-label={`Move ${widget.type} down`}
                  className="text-ink-soft hover:text-ink hover:bg-ink/5"
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleWidgetVisibility(widget.id, !widget.isVisible)}
                  aria-label={widget.isVisible ? `Hide ${widget.type}` : `Show ${widget.type}`}
                  className="text-ink-soft hover:text-ink hover:bg-ink/5"
                >
                  {widget.isVisible ? <Eye /> : <EyeOff />}
                </Button>
                <select
                  value={widget.colSpan}
                  onChange={(e) => handleWidgetColSpan(widget.id, Number(e.target.value))}
                  aria-label={`${widget.type} width`}
                  className="ml-1 px-2 py-1 rounded-md border border-ink/20 bg-paper text-ink text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink/20"
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
          <div className="relative mt-3">
            <Plus
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none"
              aria-hidden
            />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleWidgetAdd(e.target.value as WidgetType)
              }}
              aria-label="Add widget"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-ink/20 bg-paper text-ink text-sm font-serif cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink/20 appearance-none"
            >
              <option value="" disabled>
                Add a widget…
              </option>
              {availableWidgetTypes.map((type) => (
                <option key={type} value={type}>
                  {WIDGET_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )

  const rightPage = (
    <div className={editMode ? 'pt-12' : ''}>
      {visibleWritings.map((writing, idx) =>
        editMode ? (
          <div
            key={writing.id}
            className={`flex items-center gap-2 py-2 font-serif text-sm ${
              idx === 0 ? '' : 'border-t border-ink/10'
            } ${writing.isVisible ? '' : 'opacity-50'}`}
          >
            <span className="text-ink font-medium flex-1 min-w-0 truncate">
              {writing.label ?? WRITING_TYPE_LABELS[writing.type]}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleWritingMove(writing.id, writing.position, -1)}
              disabled={writing.position === 0}
              aria-label={`Move ${writing.type} up`}
              className="text-ink-soft hover:text-ink hover:bg-ink/5"
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleWritingMove(writing.id, writing.position, 1)}
              disabled={writing.position === visibleWritings.length - 1}
              aria-label={`Move ${writing.type} down`}
              className="text-ink-soft hover:text-ink hover:bg-ink/5"
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleWritingVisibility(writing.id, !writing.isVisible)}
              aria-label={writing.isVisible ? `Hide ${writing.type}` : `Show ${writing.type}`}
              className="text-ink-soft hover:text-ink hover:bg-ink/5"
            >
              {writing.isVisible ? <Eye /> : <EyeOff />}
            </Button>
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
        <div className="relative mt-3">
          <Plus
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none"
            aria-hidden
          />
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) handleWritingAdd(e.target.value as WritingType)
            }}
            aria-label="Add writing"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-ink/20 bg-paper text-ink text-sm font-serif cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink/20 appearance-none"
          >
            <option value="" disabled>
              Add a writing…
            </option>
            {availableWritingTypes.map((type) => (
              <option key={type} value={type}>
                {WRITING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
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
          className="grid place-items-center w-12 h-12 rounded-full bg-paper/10 border border-paper/30 text-paper/80 hover:text-paper hover:bg-paper/20 hover:border-paper/50 shadow-[0_4px_10px_rgba(0,0,0,0.4)] backdrop-blur-[1px] transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
        </button>
      }
      rightEdge={
        rightNavAvailable ? (
          <button
            onClick={() => onNavigateToDay(addDays(entryDate, 1))}
            className="grid place-items-center w-12 h-12 rounded-full bg-paper/10 border border-paper/30 text-paper/80 hover:text-paper hover:bg-paper/20 hover:border-paper/50 shadow-[0_4px_10px_rgba(0,0,0,0.4)] backdrop-blur-[1px] transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={2.25} />
          </button>
        ) : null
      }
    />
  )
}

export default Day
