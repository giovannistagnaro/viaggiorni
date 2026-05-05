import { EntryWidget } from '@shared/types'
import TodoListWidget from './widgets/TodoListWidget'
import MoodTrackerWidget from './widgets/MoodTrackerWidget'
import HabitTrackerWidget from './widgets/HabitTrackerWidget'

interface Props {
  widget: EntryWidget
  entryDate: string
}

function WidgetRenderer({ widget, entryDate }: Props): React.JSX.Element | null {
  if (!widget.isVisible) return null

  switch (widget.type) {
    case 'todo_list':
      return <TodoListWidget entryDate={entryDate} />
    case 'mood_tracker':
      return <MoodTrackerWidget entryId={widget.entryId} />
    case 'habit_tracker':
      return <HabitTrackerWidget entryDate={entryDate} />
    default:
      return null
  }
}

export default WidgetRenderer
