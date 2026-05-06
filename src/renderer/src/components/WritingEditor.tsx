import { EntryWriting } from '@shared/types'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@renderer/lib/useDebouncedCallback'
import { useEffect, useState } from 'react'

interface Props {
  writing: Pick<EntryWriting, 'id' | 'type' | 'label' | 'content' | 'prompt'>
  entryDate: string
  onSave: (content: string) => void
}

function WritingEditor({ writing, entryDate, onSave }: Props): React.JSX.Element {
  const debouncedSave = useDebouncedCallback(onSave, 500)
  const [prompt, setPrompt] = useState<string | null>(writing.prompt)

  useEffect(() => {
    if (writing.type !== 'writing_prompt' || writing.prompt) return

    let cancelled = false
    async function fetchPrompt(): Promise<void> {
      try {
        const result = await window.api.entryWritings.getOrCreatePromptForWriting(
          writing.id,
          entryDate
        )
        if (!cancelled) setPrompt(result)
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to fetch writing prompt', err)
      }
    }
    fetchPrompt()
    return () => {
      cancelled = true
    }
  }, [writing.id, writing.type, writing.prompt, entryDate])

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
      {prompt && <h3>{prompt}</h3>}
      <EditorContent editor={editor} />
    </div>
  )
}

export default WritingEditor
