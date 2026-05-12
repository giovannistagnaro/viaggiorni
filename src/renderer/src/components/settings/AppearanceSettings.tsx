import { SafeReturnSettings, Theme } from '@shared/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Row, SETTINGS_SELECT } from './_shared'

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
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    } catch (err) {
      console.error('Failed to change theme', err)
      toast.error('Failed to change theme')
    }
  }

  if (!settings) {
    return <p className="font-serif text-muted-foreground text-sm italic">Loading…</p>
  }

  return (
    <Row label="Theme" description="Light or dark appearance." htmlFor="settings-theme">
      <select
        id="settings-theme"
        value={settings.theme}
        onChange={(e) => handleThemeChange(e.target.value as Theme)}
        className={SETTINGS_SELECT}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </Row>
  )
}

export default AppearanceSettings
