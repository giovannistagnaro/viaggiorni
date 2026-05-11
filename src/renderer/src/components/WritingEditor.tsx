import { EntryWriting } from '@shared/types'
import { WRITING_TYPE_LABELS } from '@shared/constants'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebouncedCallback } from '@renderer/lib/useDebouncedCallback'
import { pickByDate } from '@renderer/utils/pickByDate'
import Stencil from './Stencil'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const BLUE_TORN_PAPERS = Object.values(
  import.meta.glob('@renderer/assets/torn_paper/blue/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

const WASHI_TAPES = Object.values(
  import.meta.glob('@renderer/assets/washi_tape/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

const SMALL_STENCILS = Object.values(
  import.meta.glob('@renderer/assets/stencils/small/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

interface Props {
  writing: Pick<EntryWriting, 'id' | 'type' | 'label' | 'content' | 'prompt'>
  entryDate: string
  onSave: (content: string) => void
}

const EDITOR_CLASSES =
  'font-script text-ink text-lg leading-snug [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[2.5em] [&_.ProseMirror_p]:m-0'

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
        console.error('Failed to fetch writing prompt', err)
        toast.error('Failed to fetch writing prompt')
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

  const isPromptType = writing.type === 'writing_prompt'

  if (isPromptType) {
    const promptSeed = `${entryDate}-prompt-${writing.id}`
    const paperUrl = pickByDate(promptSeed, 'prompt-paper', BLUE_TORN_PAPERS)
    const washiUrl = pickByDate(promptSeed, 'prompt-tape', WASHI_TAPES)
    const stencilUrl = pickByDate(promptSeed, 'prompt-stencil', SMALL_STENCILS)

    return (
      <div className="relative inline-block mb-6" style={{ transform: 'rotate(0.3deg)' }}>
        <img
          src={washiUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute -top-3 left-1/2 z-10 pointer-events-none select-none"
          style={{
            width: '20%',
            transform: 'translate(-50%, 0) rotate(-3deg)',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.22))'
          }}
        />
        <div
          className="relative px-6 pt-7 pb-5 min-w-[280px]"
          style={{
            backgroundImage: `url(${paperUrl})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))'
          }}
        >
          <div className="flex items-start gap-3">
            <Stencil
              src={stencilUrl}
              color="var(--color-ink)"
              className="flex-none mt-0.5"
              style={{ width: '48px', height: '48px' }}
            />
            <div className="flex-1 min-w-0">
              {prompt && (
                <h3 className="font-serif text-ink text-sm font-semibold leading-snug">{prompt}</h3>
              )}
              <div className={`mt-2 ${EDITOR_CLASSES}`}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const headerLabel = writing.label ?? WRITING_TYPE_LABELS[writing.type]
  return (
    <div className="mb-6">
      {headerLabel && (
        <>
          <h2 className="font-serif text-ink text-xs uppercase tracking-[0.18em] font-semibold">
            {headerLabel}
          </h2>
          <div className="h-px bg-ink/15 mt-1 mb-2" />
        </>
      )}
      <div className={EDITOR_CLASSES}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default WritingEditor
