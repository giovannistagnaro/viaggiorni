import { EntrySection } from '@shared/types'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@renderer/lib/useDebouncedCallback'

interface Props {
  section: Pick<EntrySection, 'id' | 'label' | 'content'>
  onSave: (content: string) => void
}

function SectionEditor({ section, onSave }: Props): React.JSX.Element {
  const debouncedSave = useDebouncedCallback(onSave, 500)

  const editor = useEditor({
    extensions: [StarterKit],
    content: section.content === null ? '' : JSON.parse(section.content),
    onUpdate: ({ editor }) => {
      debouncedSave(JSON.stringify(editor.getJSON()))
    }
  })

  return (
    <div>
      {section.label && <h2>{section.label}</h2>}
      <EditorContent editor={editor} />
    </div>
  )
}

export default SectionEditor
