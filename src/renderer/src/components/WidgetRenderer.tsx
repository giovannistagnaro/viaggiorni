import { EntryWidget } from '@shared/types'
import { WIDGET_TYPE_LABELS } from '@shared/constants'
import TodoListWidget from './widgets/TodoListWidget'
import HabitTrackerWidget from './widgets/HabitTrackerWidget'
import WordOfDayWidget from './widgets/WordOfDayWidget'
import PhotoWidget from './widgets/PhotoWidget'
import MoodTrackerWidget from './widgets/MoodTrackerWidget'
import WidgetLabel from './WidgetLabel'

interface Props {
  widget: EntryWidget
  entryDate: string
}

function WidgetRenderer({ widget, entryDate }: Props): React.JSX.Element | null {
  if (!widget.isVisible) return null

  let content: React.ReactNode = null
  switch (widget.type) {
    case 'todo_list':
      content = <TodoListWidget entryDate={entryDate} />
      break
    case 'mood_tracker':
      content = <MoodTrackerWidget entryId={widget.entryId} />
      break
    case 'habit_tracker':
      content = <HabitTrackerWidget entryDate={entryDate} />
      break
    case 'word_of_day':
      content = <WordOfDayWidget entryDate={entryDate} />
      break
    case 'photo':
      content = <PhotoWidget entryId={widget.entryId} />
      break
    default:
      return null
  }

  return (
    <div className="mb-6">
      <WidgetLabel>{WIDGET_TYPE_LABELS[widget.type]}</WidgetLabel>
      {content}
    </div>
  )
}

export default WidgetRenderer
