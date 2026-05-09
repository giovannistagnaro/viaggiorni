interface Props {
  onNavigate: (screen: 'index' | 'day') => void
  onNavigateToToday: () => void
}

function Cover({ onNavigate, onNavigateToToday }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1>Viaggiorni</h1>
      <h3>{new Date().getFullYear()}</h3>

      <div className="flex gap-4">
        <button onClick={() => onNavigate('index')}>Open</button>
        <button onClick={onNavigateToToday}>Today</button>
      </div>
    </div>
  )
}

export default Cover
