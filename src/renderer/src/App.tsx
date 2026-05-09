import { useEffect, useState } from 'react'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Cover from './screens/Cover'
import { PostLoginScreen, Screen } from '@renderer/types'
import { formatDateISO } from './utils/dateFormatters'
import Topbar from './components/Topbar'
import Day from './screens/Day'
import Index from './screens/Index'

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('loading')
  const [entryDate] = useState<string>(formatDateISO(new Date()))

  useEffect(() => {
    async function detectStartScreen(): Promise<void> {
      const isFirst = await window.api.db.isFirstLaunch()
      setScreen(isFirst ? 'onboarding' : 'login')
    }
    detectStartScreen()
  }, [])

  function handleNavigate(screen: PostLoginScreen): void {
    setScreen(screen)
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
        onNavigate={handleNavigate}
        onLock={handleLock}
      />

      {screen === 'cover' ? (
        <main className="flex-1 grid place-items-center">
          <Cover onNavigate={(screen: 'index' | 'day') => setScreen(screen)} />
        </main>
      ) : screen === 'index' ? (
        <Index />
      ) : (
        <Day />
      )}
    </div>
  )
}

export default App
