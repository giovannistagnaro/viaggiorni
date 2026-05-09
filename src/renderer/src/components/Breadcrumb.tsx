import React from 'react'

interface Props {
  currentScreen: 'cover' | 'index' | 'day'
  entryDate?: string
  onNavigate: (screen: 'cover' | 'index') => void
}

function BreadCrumb({ currentScreen, entryDate, onNavigate }: Props): React.JSX.Element {
  return (
    <nav aria-label="Breadcrumb" className="grid grid-flow-col justify-start gap-2">
      {currentScreen === 'cover' ? (
        <span>Cover</span>
      ) : (
        <button onClick={() => onNavigate('cover')}>Cover</button>
      )}
      {currentScreen !== 'cover' && (
        <>
          <span> {'>'} </span>
          {currentScreen === 'index' ? (
            <span>Index</span>
          ) : (
            <button onClick={() => onNavigate('index')}>Index</button>
          )}
        </>
      )}
      {currentScreen === 'day' && entryDate && (
        <>
          <span> {'>'} </span>
          <span>{entryDate}</span>
        </>
      )}
    </nav>
  )
}

export default BreadCrumb
