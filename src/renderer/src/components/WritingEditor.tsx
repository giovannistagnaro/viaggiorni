import { EntryWriting } from '@shared/types'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@renderer/lib/useDebouncedCallback'

interface Props {
  writing: Pick<EntryWriting, 'id' | 'label' | 'content'>
  onSave: (content: string) => void
}

function WritingEditor({ writing, onSave }: Props): React.JSX.Element {
  const debouncedSave = useDebouncedCallback(onSave, 500)

  const editor = useEditor({
    extensions: [StarterKit],
    content: writing.content === null ? '' : JSON.parse(writing.content),
    onUpdate: ({ editor }) => {
      debouncedSave(JSON.stringify(editor.getJSON()))
    }
  })

  return (
    <div>
      {writing.label && <h2>{writing.label}</h2>}
      <EditorContent editor={editor} />
    </div>
  )
}

export default WritingEditor
