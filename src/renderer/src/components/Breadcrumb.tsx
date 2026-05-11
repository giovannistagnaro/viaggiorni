import { NonOverlayScreen, PostLoginScreen } from '@renderer/types'
import { SCREEN_CONFIG } from '@renderer/screenConfig'
import { ChevronRight } from 'lucide-react'
import React from 'react'

interface Props {
  currentScreen: PostLoginScreen
  entryDate?: string
  previousScreen?: NonOverlayScreen
  onNavigate: (screen: PostLoginScreen) => void
}

function buildChain(
  screen: PostLoginScreen,
  previousScreen: PostLoginScreen | undefined
): PostLoginScreen[] {
  const config = SCREEN_CONFIG[screen]
  if (config.isOverlay) {
    const base = previousScreen ? buildChain(previousScreen, undefined) : ['cover' as const]
    return [...base, screen]
  }
  if (!config.parent) return [screen]
  return [...buildChain(config.parent, undefined), screen]
}

function BreadCrumb(props: Props): React.JSX.Element {
  const { currentScreen, previousScreen, entryDate, onNavigate } = props
  const chain = buildChain(currentScreen, previousScreen)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2">
      {chain.map((screen, idx) => {
        const cfg = SCREEN_CONFIG[screen]
        const label = typeof cfg.label === 'function' ? cfg.label({ entryDate }) : cfg.label
        const isCurrent = screen === currentScreen
        return (
          <React.Fragment key={screen}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-paper/40" strokeWidth={2} />}
            {isCurrent ? (
              <span className="text-paper">{label}</span>
            ) : (
              <button
                onClick={() => onNavigate(screen)}
                className="text-paper/60 hover:text-paper transition-colors"
              >
                {label}
              </button>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default BreadCrumb
