import { SafeReturnSettings } from '@shared/types'
import { useEffect, useState } from 'react'

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
      // TODO: surface to user via error UI
      console.error('Failed to change Ollama model', err)
    }
  }

  async function handleOllamaAvailabilityCheck(): Promise<void> {
    try {
      setOllamaAvailable(await window.api.ollama.isOllamaAvailable())
      setModels(await window.api.ollama.listOllamaModels())
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to check Ollama availability', err)
    }
  }

  return !settings ? (
    <div>Loading...</div>
  ) : (
    <div>
      <p>Ollama {ollamaAvailable ? 'is' : 'is not'} available!</p>
      {ollamaAvailable && models && (
        <div>
          <select
            value={settings.ollamaModel ?? ''}
            onChange={(e) => handleModelChange(e.target.value)}
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
        </div>
      )}
      <button onClick={handleOllamaAvailabilityCheck}>Refresh</button>
    </div>
  )
}

export default AISettings
