'use client'

import { useRef, useCallback } from 'react'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Link2, AlignLeft, AlignCenter, Heading2, Minus,
} from 'lucide-react'

interface RichTextEditorProps {
  value:       string
  onChange:    (html: string) => void
  placeholder?: string
  minHeight?:  string
}

interface ToolbarButton {
  icon:    React.ElementType
  title:   string
  action:  () => void
  divider?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  minHeight   = '180px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    // Emit updated HTML after command
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url) exec('createLink', url)
  }, [exec])

  const buttons: ToolbarButton[] = [
    { icon: Bold,         title: 'Bold',           action: () => exec('bold') },
    { icon: Italic,       title: 'Italic',         action: () => exec('italic') },
    { icon: Underline,    title: 'Underline',      action: () => exec('underline'), divider: true },
    { icon: Heading2,     title: 'Heading',        action: () => exec('formatBlock', 'H2') },
    { icon: AlignLeft,    title: 'Paragraph',      action: () => exec('formatBlock', 'P'), divider: true },
    { icon: List,         title: 'Bullet list',    action: () => exec('insertUnorderedList') },
    { icon: ListOrdered,  title: 'Numbered list',  action: () => exec('insertOrderedList'), divider: true },
    { icon: Link2,        title: 'Insert link',    action: insertLink },
    { icon: Minus,        title: 'Divider',        action: () => exec('insertHorizontalRule') },
  ]

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        {buttons.map((btn, i) => (
          <span key={i} className="contents">
            {btn.divider && <span className="w-px h-4 bg-gray-200 mx-1" />}
            <button
              type="button"
              title={btn.title}
              onMouseDown={e => { e.preventDefault(); btn.action() }}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <btn.icon className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight }}
        className="px-3 py-2.5 text-sm text-gray-800 outline-none prose prose-sm max-w-none
          [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1
          [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
          [&_a]:text-indigo-600 [&_a]:underline
          [&_hr]:border-gray-200 [&_hr]:my-3"
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={e => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        onPaste={e => {
          // Strip non-text on paste — avoid pasting Word garbage
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, text)
        }}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
