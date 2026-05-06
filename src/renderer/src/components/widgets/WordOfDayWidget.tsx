import { WordOfDay } from '@shared/types'
import { useEffect, useState } from 'react'

interface Props {
  entryDate: string
}

function WordOfDayWidget({ entryDate }: Props): React.JSX.Element {
  const [word, setWord] = useState<WordOfDay | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function getWordOfDay(): Promise<void> {
      try {
        setWord(await window.api.wordOfDay.getOrCreateForDate(entryDate))
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to load word of day', err)
      } finally {
        setIsLoading(false)
      }
    }
    getWordOfDay()
  }, [entryDate])

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : word === null ? (
        <div>No word available today.</div>
      ) : (
        <div>
          <h3>{word.word}</h3>
          <p>Definition: {word?.definition}</p>
          <p>
            Example: <em>{word?.example}</em>
          </p>
        </div>
      )}
    </>
  )
}

export default WordOfDayWidget
