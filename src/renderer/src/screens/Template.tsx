import { ActiveTemplate, WidgetType, WritingType } from '@shared/types'
import { WIDGET_TYPES, WRITING_TYPES, WRITING_TYPE_LABELS } from '@shared/constants'
import { useEffect, useState } from 'react'

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

  return (
    <div className="grid grid-cols-2 px-1">
      <div className="grid grid-cols-1 place-items-start">
        <h1>Widgets</h1>
        {activeTemplate.widgets.map((activeWidget) => (
          <div key={activeWidget.id} className="grid grid-cols-4">
            <h1>{activeWidget.type}</h1>
            <button onClick={() => handleWidgetMove(activeWidget.id, activeWidget.position, -1)}>
              [Up]
            </button>
            <button onClick={() => handleWidgetMove(activeWidget.id, activeWidget.position, 1)}>
              [Down]
            </button>
            <button onClick={() => handleWidgetRemove(activeWidget.id)}>[-]</button>
          </div>
        ))}
        {availableWidgetTypes.length > 0 && (
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
      <div className="grid grid-cols-1 place-items-start">
        <h1>Writings</h1>
        {activeTemplate.writings.map((activeWriting) => (
          <div key={activeWriting.id} className="grid grid-cols-4">
            <h1>{activeWriting.type}</h1>
            <button onClick={() => handleWritingMove(activeWriting.id, activeWriting.position, -1)}>
              [Up]
            </button>
            <button onClick={() => handleWritingMove(activeWriting.id, activeWriting.position, 1)}>
              [Down]
            </button>
            <button onClick={() => handleWritingRemove(activeWriting.id)}>[-]</button>
          </div>
        ))}
        {availableWritingTypes.length > 0 && (
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
  )
}
export default Template
