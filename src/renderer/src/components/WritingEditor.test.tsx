import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import WritingEditor from './WritingEditor'

const baseWriting = {
  id: 1,
  label: 'Daily Summary',
  content: null
}

describe('WritingEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the writing label when present', () => {
    render(<WritingEditor writing={baseWriting} onSave={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Daily Summary' })).toBeInTheDocument()
  })

  it('does not render a heading when label is null', () => {
    const nullLabelWriting = { ...baseWriting, label: null }
    render(<WritingEditor writing={nullLabelWriting} onSave={vi.fn()} />)

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders the editor', () => {
    const { container } = render(<WritingEditor writing={baseWriting} onSave={vi.fn()} />)

    expect(container.querySelector('.ProseMirror')).toBeInTheDocument()
  })

  it('initializes the editor with parsed content from writing.content', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello world' }]
        }
      ]
    })
    const writingWithContent = { ...baseWriting, content }

    const { container } = render(<WritingEditor writing={writingWithContent} onSave={vi.fn()} />)

    expect(container.querySelector('.ProseMirror')).toHaveTextContent('hello world')
  })

  it('renders an empty editor when writing.content is null', () => {
    render(<WritingEditor writing={baseWriting} onSave={vi.fn()} />)

    const editor = document.querySelector('.ProseMirror')
    expect(editor?.textContent).toBe('')
  })
})
