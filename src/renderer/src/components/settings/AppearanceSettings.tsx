import { SafeReturnSettings, Theme } from '@shared/types'
import { useEffect, useState } from 'react'

function AppearanceSettings(): React.JSX.Element {
  const [settings, setSettings] = useState<SafeReturnSettings | null>(null)

  useEffect(() => {
    async function getSettings(): Promise<void> {
      setSettings(await window.api.settings.getSettings())
    }

    getSettings()
  }, [])

  async function handleThemeChange(newTheme: Theme): Promise<void> {
    try {
      if (!settings) return

      await window.api.settings.updateTheme(newTheme)
      setSettings({ ...settings, theme: newTheme })
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to change theme', err)
    }
  }

  return !settings ? (
    <div>Loading...</div>
  ) : (
    <div>
      <span>Theme: </span>
      <select value={settings.theme} onChange={(e) => handleThemeChange(e.target.value as Theme)}>
        <option value={'light'}>Light</option>
        <option value={'dark'}>Dark</option>
      </select>
    </div>
  )
}

export default AppearanceSettings
