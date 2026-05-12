import { ActiveTemplate, WidgetType, WritingType } from '@shared/types'
import {
  WIDGET_TYPES,
  WIDGET_TYPE_LABELS,
  WRITING_TYPES,
  WRITING_TYPE_LABELS
} from '@shared/constants'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { SETTINGS_SELECT } from '@renderer/components/settings/_shared'

function Template(): React.JSX.Element {
  const [activeTemplate, setActiveTemplate] = useState<ActiveTemplate>({
    id: 0,
    widgets: [],
    writings: []
  })

  async function refreshTemplate(): Promise<void> {
    setActiveTemplate(await window.api.template.getActiveTemplate())
  }

  useEffect(() => {
    async function loadActiveTemplate(): Promise<void> {
      await refreshTemplate()
    }
    loadActiveTemplate()
  }, [])

  async function handleWidgetMove(
    widgetId: number,
    position: number,
    direction: 1 | -1
  ): Promise<void> {
    await window.api.template.changeTemplateWidgetPosition(widgetId, position + direction)
    await refreshTemplate()
  }

  async function handleWritingMove(
    writingId: number,
    position: number,
    direction: 1 | -1
  ): Promise<void> {
    await window.api.template.changeTemplateWritingPosition(writingId, position + direction)
    await refreshTemplate()
  }

  async function handleWidgetRemove(widgetId: number): Promise<void> {
    await window.api.template.removeTemplateWidget(widgetId)
    await refreshTemplate()
  }

  async function handleWritingRemove(writingId: number): Promise<void> {
    await window.api.template.removeTemplateWriting(writingId)
    await refreshTemplate()
  }

  async function handleWidgetAdd(type: WidgetType): Promise<void> {
    await window.api.template.addTemplateWidget(activeTemplate.id, type)
    await refreshTemplate()
  }

  async function handleWidgetColSpan(
    widgetId: number,
    colSpan: number,
    isVisible: boolean
  ): Promise<void> {
    await window.api.template.updateTemplateWidget(widgetId, colSpan, isVisible)
    await refreshTemplate()
  }

  async function handleWritingAdd(type: WritingType): Promise<void> {
    await window.api.template.addTemplateWriting(activeTemplate.id, type, WRITING_TYPE_LABELS[type])
    await refreshTemplate()
  }

  const usedWidgetTypes = new Set(activeTemplate.widgets.map((w) => w.type))
  const availableWidgetTypes = WIDGET_TYPES.filter((t) => !usedWidgetTypes.has(t))

  const usedWritingTypes = new Set(activeTemplate.writings.map((w) => w.type))
  const availableWritingTypes = WRITING_TYPES.filter(
    (t) => t !== 'custom' && !usedWritingTypes.has(t)
  )

  const lastWidgetPosition = activeTemplate.widgets.length - 1
  const lastWritingPosition = activeTemplate.writings.length - 1

  return (
    <main className="flex-1 flex bg-background text-foreground overflow-hidden">
      <section className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-10 py-10">
          <header className="mb-6">
            <h1 className="font-serif text-foreground text-2xl font-semibold">Template</h1>
            <p className="font-serif text-muted-foreground text-sm mt-1">
              Choose which widgets and writings appear on every new day, and how they&apos;re laid
              out.
            </p>
            <div className="h-px bg-border mt-4" />
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="font-serif text-foreground text-sm uppercase tracking-[0.18em] font-semibold mb-2">
                Widgets
              </h2>
              <div className="h-px bg-border mb-2" />
              <div className="divide-y divide-border">
                {activeTemplate.widgets.map((activeWidget) => (
                  <div
                    key={activeWidget.id}
                    className="flex items-center gap-2 py-2 font-serif text-sm"
                  >
                    <span className="text-foreground font-medium flex-1 min-w-0 truncate">
                      {WIDGET_TYPE_LABELS[activeWidget.type]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleWidgetMove(activeWidget.id, activeWidget.position, -1)}
                      disabled={activeWidget.position === 0}
                      aria-label={`Move ${activeWidget.type} up`}
                      title="Move up"
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleWidgetMove(activeWidget.id, activeWidget.position, 1)}
                      disabled={activeWidget.position === lastWidgetPosition}
                      aria-label={`Move ${activeWidget.type} down`}
                      title="Move down"
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleWidgetRemove(activeWidget.id)}
                      aria-label={`Remove ${activeWidget.type}`}
                      title="Remove"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X />
                    </Button>
                    <select
                      value={activeWidget.colSpan}
                      onChange={(e) =>
                        handleWidgetColSpan(
                          activeWidget.id,
                          Number(e.target.value),
                          activeWidget.isVisible
                        )
                      }
                      aria-label={`${activeWidget.type} width`}
                      className="ml-1 px-2 py-1 rounded-md border border-input bg-background text-foreground text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/40"
                    >
                      <option value={2}>Half</option>
                      <option value={4}>Full</option>
                    </select>
                  </div>
                ))}
              </div>

              {availableWidgetTypes.length > 0 && (
                <div className="relative mt-3">
                  <Plus
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    aria-hidden
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleWidgetAdd(e.target.value as WidgetType)
                    }}
                    aria-label="Add widget"
                    className={`${SETTINGS_SELECT} pl-9 text-sm`}
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

            <div>
              <h2 className="font-serif text-foreground text-sm uppercase tracking-[0.18em] font-semibold mb-2">
                Writings
              </h2>
              <div className="h-px bg-border mb-2" />
              <div className="divide-y divide-border">
                {activeTemplate.writings.map((activeWriting) => (
                  <div
                    key={activeWriting.id}
                    className="flex items-center gap-2 py-2 font-serif text-sm"
                  >
                    <span className="text-foreground font-medium flex-1 min-w-0 truncate">
                      {WRITING_TYPE_LABELS[activeWriting.type]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        handleWritingMove(activeWriting.id, activeWriting.position, -1)
                      }
                      disabled={activeWriting.position === 0}
                      aria-label={`Move ${activeWriting.type} up`}
                      title="Move up"
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleWritingMove(activeWriting.id, activeWriting.position, 1)}
                      disabled={activeWriting.position === lastWritingPosition}
                      aria-label={`Move ${activeWriting.type} down`}
                      title="Move down"
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleWritingRemove(activeWriting.id)}
                      aria-label={`Remove ${activeWriting.type}`}
                      title="Remove"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>

              {availableWritingTypes.length > 0 && (
                <div className="relative mt-3">
                  <Plus
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    aria-hidden
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleWritingAdd(e.target.value as WritingType)
                    }}
                    aria-label="Add writing"
                    className={`${SETTINGS_SELECT} pl-9 text-sm`}
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
          </div>
        </div>
      </section>
    </main>
  )
}
export default Template
