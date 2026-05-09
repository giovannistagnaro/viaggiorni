import { useEffect, useState } from 'react'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Cover from './screens/Cover'
import { PostLoginScreen, Screen } from '@renderer/types'
import { formatDateISO } from './utils/dateFormatters'
import Topbar from './components/Topbar'
import Day from './screens/Day'
import Index from './screens/Index'
import Settings from './screens/Settings'

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('loading')
  const [entryDate, setEntryDate] = useState<string>(formatDateISO(new Date()))
  const [today, setToday] = useState<string>(formatDateISO(new Date()))
  const [previousScreen, setPreviousScreen] =
    useState<Exclude<PostLoginScreen, 'settings'>>('cover')

  useEffect(() => {
    async function detectStartScreen(): Promise<void> {
      const isFirst = await window.api.db.isFirstLaunch()
      setScreen(isFirst ? 'onboarding' : 'login')
      setToday(formatDateISO(new Date()))
    }
    detectStartScreen()
  }, [])

  useEffect(() => {
    async function setTodayWrapper(): Promise<void> {
      setToday(formatDateISO(new Date()))
    }
    setTodayWrapper()
  }, [screen])

  function handleNavigate(target: PostLoginScreen): void {
    if (target === 'settings' && screen !== 'settings') {
      setPreviousScreen(screen as Exclude<PostLoginScreen, 'settings'>)
    }
    setScreen(target)
  }

  function handleNavigateToDay(date: string): void {
    setEntryDate(date)
    setScreen('day')
  }

  async function handleLock(): Promise<void> {
    ;(document.activeElement as HTMLElement | null)?.blur()
    // give pending IPC a tick to complete
    await new Promise((r) => setTimeout(r, 0))
    try {
      await window.api.db.close()
    } catch (err) {
      console.error('Failed to close DB', err)
    }
    setScreen('login')
  }

  if (screen === 'loading') return <div>Loading...</div>
  if (screen === 'onboarding') return <Onboarding onComplete={() => setScreen('cover')} />
  if (screen === 'login') return <Login onSuccess={() => setScreen('cover')} />
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        currentScreen={screen}
        entryDate={entryDate}
        previousScreen={previousScreen}
        onNavigate={handleNavigate}
        onNavigateToDay={handleNavigateToDay}
        onLock={handleLock}
      />

      {screen === 'cover' ? (
        <main className="flex-1 grid place-items-center">
          <Cover
            onNavigate={(screen: 'index' | 'day') => setScreen(screen)}
            onNavigateToToday={() => handleNavigateToDay(today)}
          />
        </main>
      ) : screen === 'index' ? (
        <Index onNavigateToDay={handleNavigateToDay} />
      ) : screen === 'settings' ? (
        <Settings />
      ) : (
        <Day entryDate={entryDate} />
      )}
    </div>
  )
}

export default App
