import { useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faCircleInfo, faPaperPlane } from '@fortawesome/free-solid-svg-icons'

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  onToggleExamples,
  examplesOpen,
  anchorRef,
  onToggleContext,
  contextOpen: _contextOpen,
  contextAnchorRef,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  onToggleExamples: () => void
  examplesOpen: boolean
  anchorRef: React.RefObject<HTMLButtonElement>
  onToggleContext: () => void
  contextOpen: boolean
  contextAnchorRef: React.RefObject<HTMLButtonElement>
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(200, ta.scrollHeight) + 'px'
  }, [value])

  return (
    <div className="sticky bottom-0 left-0 right-0 border-t bg-white/70 backdrop-blur dark:bg-zinc-950/70 dark:border-zinc-800">
      <div className="mx-auto max-w-3xl p-3">
        <div className="relative flex items-end gap-2 rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 px-3 py-2 shadow-sm">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === '/' && !examplesOpen && !value.trim()) {
                e.preventDefault()
                onToggleExamples()
                return
              }
              if (e.key === 'Escape') {
                if (examplesOpen) {
                  e.preventDefault()
                  onToggleExamples()
                  return
                }
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder="Ask a question…"
            className="w-full resize-none bg-transparent outline-none placeholder:text-zinc-400 text-[15px] leading-6 py-1 pl-10 pr-12"
          />

          <button
            type="button"
            aria-label="Open example prompts"
            onClick={onToggleExamples}
            ref={anchorRef}
            className="absolute left-2 bottom-2 h-8 w-8 grid place-items-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>

          <button
            type="button"
            aria-label="Show data context"
            onClick={onToggleContext}
            ref={contextAnchorRef}
            className="absolute -right-10 bottom-2 h-8 w-8 grid place-items-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>

          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="absolute right-2 bottom-2 h-8 w-8 grid place-items-center rounded-lg text-blue-600 disabled:opacity-50"
            aria-label="Send message"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Enter to send • Shift+Enter for newline • "/" opens examples
        </div>
      </div>
    </div>
  )
}
