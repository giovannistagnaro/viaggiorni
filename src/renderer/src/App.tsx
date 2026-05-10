import { useEffect, useState } from 'react'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Cover from './screens/Cover'
import { NonOverlayScreen, PostLoginScreen, Screen } from '@renderer/types'
import { formatDateISO } from './utils/dateFormatters'
import Topbar from './components/Topbar'
import Day from './screens/Day'
import Index from './screens/Index'
import Settings from './screens/Settings'
import BreadCrumb from './components/Breadcrumb'
import Template from './screens/Template'
import { SCREEN_CONFIG } from './screenConfig'
import { useHotkeys } from 'react-hotkeys-hook'

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('loading')
  const [entryDate, setEntryDate] = useState<string>(formatDateISO(new Date()))
  const [today, setToday] = useState<string>(formatDateISO(new Date()))
  const [previousScreen, setPreviousScreen] = useState<NonOverlayScreen>('cover')

  const isPostLogin = screen !== 'loading' && screen !== 'onboarding' && screen !== 'login'

  useHotkeys('mod+l', () => handleLock(), { enabled: isPostLogin })
  useHotkeys(
    'mod+Comma',
    () => (screen === 'settings' ? handleNavigate(previousScreen) : handleNavigate('settings')),
    { enabled: isPostLogin }
  )
  useHotkeys(
    'mod+Period',
    () => (screen === 'template' ? handleNavigate(previousScreen) : handleNavigate('template')),
    { enabled: isPostLogin }
  )
  useHotkeys(
    'esc',
    () => {
      if (isPostLogin && SCREEN_CONFIG[screen].isOverlay) handleNavigate(previousScreen)
    },
    { enabled: isPostLogin }
  )

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
    const targetIsOverlay = SCREEN_CONFIG[target].isOverlay
    const currentIsOverlay = SCREEN_CONFIG[screen as PostLoginScreen]?.isOverlay
    if (targetIsOverlay && !currentIsOverlay) {
      setPreviousScreen(screen as NonOverlayScreen)
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
        onLock={handleLock}
        onNavigateToSettings={() => handleNavigate('settings')}
        onNavigateToTemplate={() => handleNavigate('template')}
      >
        <BreadCrumb
          currentScreen={screen}
          entryDate={entryDate}
          previousScreen={previousScreen}
          onNavigate={handleNavigate}
        />
      </Topbar>

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
      ) : screen === 'template' ? (
        <Template />
      ) : (
        <main className="flex-1 grid">
          <Day entryDate={entryDate} onNavigateToDay={handleNavigateToDay} today={today} />
        </main>
      )}
    </div>
  )
}

export default App
