import AISettings from '@renderer/components/settings/AISettings'
import AppearanceSettings from '@renderer/components/settings/AppearanceSettings'
import BackupSettings from '@renderer/components/settings/BackupSettings'
import HabitSettings from '@renderer/components/settings/HabitSettings'
import MoodSettings from '@renderer/components/settings/MoodSettings'
import ProfileSettings from '@renderer/components/settings/ProfileSettings'
import { useState } from 'react'

interface Props {
  onLock: () => void
}

const SECTIONS = ['Profile', 'Appearance', 'Habits', 'Moods', 'AI', 'Backup'] as const
type Section = (typeof SECTIONS)[number]

const DESCRIPTIONS: Record<Section, string> = {
  Profile: 'How you appear in the app.',
  Appearance: 'Theme and visual preferences.',
  Habits: 'Manage habits and streak settings.',
  Moods: 'Moods available on each entry.',
  AI: 'Local AI model used for prompts and reflections.',
  Backup: 'Export your journal or restore from a backup.'
}

function Settings({ onLock }: Props): React.JSX.Element {
  const [section, setSection] = useState<Section>('Profile')

  return (
    <main className="flex-1 flex bg-paper-aged/30 overflow-hidden">
      <nav
        aria-label="Settings sections"
        className="w-56 border-r border-ink/10 bg-paper py-6 px-3 flex flex-col gap-1 flex-none"
      >
        {SECTIONS.map((sectionName) => (
          <button
            key={sectionName}
            onClick={() => setSection(sectionName)}
            aria-current={section === sectionName ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-md font-serif text-sm transition-colors ${
              section === sectionName
                ? 'bg-ink text-paper font-medium'
                : 'text-ink-soft hover:text-ink hover:bg-ink/5'
            }`}
          >
            {sectionName}
          </button>
        ))}
      </nav>

      <section className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-10 py-10">
          <header className="mb-6">
            <h1 className="font-serif text-ink text-2xl font-semibold">{section}</h1>
            <p className="font-serif text-ink-soft text-sm mt-1">{DESCRIPTIONS[section]}</p>
            <div className="h-px bg-ink/15 mt-4" />
          </header>

          {section === 'Profile' && <ProfileSettings />}
          {section === 'Appearance' && <AppearanceSettings />}
          {section === 'Habits' && <HabitSettings />}
          {section === 'Moods' && <MoodSettings />}
          {section === 'AI' && <AISettings />}
          {section === 'Backup' && <BackupSettings onLockRequired={onLock} />}
        </div>
      </section>
    </main>
  )
}
export default Settings
