import { SafeReturnSettings } from '@shared/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { Row, SETTINGS_SELECT } from './_shared'

function AISettings(): React.JSX.Element {
  const [settings, setSettings] = useState<SafeReturnSettings | null>(null)
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean>(false)
  const [models, setModels] = useState<string[] | null>(null)

  useEffect(() => {
    async function getData(): Promise<void> {
      setSettings(await window.api.settings.getSettings())
      setOllamaAvailable(await window.api.ollama.isOllamaAvailable())
      setModels(await window.api.ollama.listOllamaModels())
    }
    getData()
  }, [])

  async function handleModelChange(newModel: string): Promise<void> {
    try {
      if (!settings || !newModel) return
      await window.api.settings.updateOllamaModel(newModel)
      setSettings({ ...settings, ollamaModel: newModel })
    } catch (err) {
      console.error('Failed to change Ollama model', err)
      toast.error('Failed to change Ollama model')
    }
  }

  async function handleOllamaAvailabilityCheck(): Promise<void> {
    try {
      setOllamaAvailable(await window.api.ollama.isOllamaAvailable())
      setModels(await window.api.ollama.listOllamaModels())
    } catch (err) {
      console.error('Failed to check Ollama availability', err)
      toast.error('Failed to check Ollama availability')
    }
  }

  if (!settings) {
    return <p className="font-serif text-muted-foreground text-sm italic">Loading…</p>
  }

  return (
    <>
      <Row label="Ollama" description="Local LLM runtime used for AI features.">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-serif text-sm">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${ollamaAvailable ? 'bg-sage' : 'bg-rust'}`}
            />
            <span className="text-foreground">
              {ollamaAvailable ? 'Available' : 'Not available'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleOllamaAvailabilityCheck}>
            <RefreshCw />
            Refresh
          </Button>
        </div>
      </Row>

      {ollamaAvailable && models && (
        <Row
          label="Model"
          description="Pick which installed model to use."
          htmlFor="settings-ollama-model"
        >
          <select
            id="settings-ollama-model"
            value={settings.ollamaModel ?? ''}
            onChange={(e) => handleModelChange(e.target.value)}
            className={SETTINGS_SELECT}
          >
            {settings.ollamaModel === null && (
              <option value="" disabled>
                Select a model
              </option>
            )}
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </Row>
      )}
    </>
  )
}

export default AISettings
