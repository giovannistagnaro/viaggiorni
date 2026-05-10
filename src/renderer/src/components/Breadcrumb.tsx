import { NonOverlayScreen, PostLoginScreen } from '@renderer/types'
import { SCREEN_CONFIG } from '@renderer/screenConfig'
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
    <nav aria-label="Breadcrumb" className="grid grid-flow-col justify-start gap-2">
      {chain.map((screen, idx) => {
        const cfg = SCREEN_CONFIG[screen]
        const label = typeof cfg.label === 'function' ? cfg.label({ entryDate }) : cfg.label
        const isCurrent = screen === currentScreen
        return (
          <React.Fragment key={screen}>
            {idx > 0 && <span> {'>'} </span>}
            {isCurrent ? (
              <span>{label}</span>
            ) : (
              <button onClick={() => onNavigate(screen)}>{label}</button>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default BreadCrumb
