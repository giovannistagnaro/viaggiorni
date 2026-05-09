import { PostLoginScreen } from '@renderer/types'
import React from 'react'

interface Props {
  currentScreen: PostLoginScreen
  entryDate?: string
  previousScreen?: Exclude<PostLoginScreen, 'settings'>
  onNavigate: (screen: 'cover' | 'index') => void
  onNavigateToDay?: (date: string) => void
}

type Segment = { label: string; onClick?: () => void }

function computeSegments(props: Props): Segment[] {
  const { currentScreen, previousScreen, entryDate, onNavigate, onNavigateToDay } = props
  const segments: Segment[] = []

  segments.push({
    label: 'Cover',
    onClick: currentScreen === 'cover' ? undefined : () => onNavigate('cover')
  })

  const showIndex =
    currentScreen === 'index' ||
    currentScreen === 'day' ||
    (currentScreen === 'settings' && (previousScreen === 'index' || previousScreen === 'day'))
  if (showIndex) {
    segments.push({
      label: 'Index',
      onClick: currentScreen === 'index' ? undefined : () => onNavigate('index')
    })
  }

  const showDate =
    entryDate &&
    (currentScreen === 'day' || (currentScreen === 'settings' && previousScreen === 'day'))
  if (showDate) {
    segments.push({
      label: entryDate,
      onClick: currentScreen === 'settings' ? () => onNavigateToDay?.(entryDate) : undefined
    })
  }

  if (currentScreen === 'settings') {
    segments.push({ label: 'Settings' })
  }

  return segments
}

function BreadCrumb(props: Props): React.JSX.Element {
  const segments = computeSegments(props)
  return (
    <nav aria-label="Breadcrumb" className="grid grid-flow-col justify-start gap-2">
      {segments.map((segment, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span> {'>'} </span>}
          {segment.onClick ? (
            <button onClick={segment.onClick}>{segment.label}</button>
          ) : (
            <span>{segment.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default BreadCrumb
