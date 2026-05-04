import { EntryWidget } from '@shared/types'
import TodoListWidget from './widgets/TodoListWidget'

interface Props {
  widget: EntryWidget
  entryDate: string
}

function WidgetRenderer({ widget, entryDate }: Props): React.JSX.Element | null {
  if (!widget.isVisible) return null

  switch (widget.type) {
    case 'todo_list':
      return <TodoListWidget entryDate={entryDate} />
    default:
      return null
  }
}

export default WidgetRenderer
