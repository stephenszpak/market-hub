import { useEffect, useMemo, useRef, useState } from 'react'

export type ExamplePrompt = {
  id: string
  title: string
  subtitle?: string
  body: string
}

export function ExamplePromptPopover({
  examples,
  open,
  onClose,
  onInsert,
  anchorRef,
}: {
  examples: ExamplePrompt[]
  open: boolean
  onClose: () => void
  onInsert: (body: string, append?: boolean) => void
  anchorRef: React.RefObject<HTMLElement>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return examples
    return examples.filter(
      (e) =>
        e.title.toLowerCase().includes(t) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(t)) ||
        e.body.toLowerCase().includes(t)
    )
  }, [examples, q])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault()
        setIdx((i) => {
          if (filtered.length === 0) return 0
          let next = i
          const cols = 2 // simple grid assumption
          if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) next = Math.min(i + cols, filtered.length - 1)
          if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) next = Math.max(i - cols, 0)
          if (e.key === 'ArrowRight') next = Math.min(i + 1, filtered.length - 1)
          if (e.key === 'ArrowLeft') next = Math.max(i - 1, 0)
          return next
        })
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const choose = filtered[idx]
        if (choose) {
          onInsert(choose.body)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, idx, onClose, onInsert])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current && anchorRef.current.contains(t as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    // focus search
    setTimeout(() => searchRef.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, anchorRef, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute bottom-14 right-0 z-20 w-[min(680px,95vw)] rounded-2xl border bg-white dark:bg-zinc-900 shadow-xl p-3"
      role="dialog"
      aria-modal="true"
    >
      <input
        ref={searchRef}
        aria-label="Search example prompts"
        placeholder="Search examples…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full mb-2 rounded-lg border px-2 py-1 text-sm bg-white dark:bg-zinc-950"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((ex, i) => (
          <button
            key={ex.id}
            onClick={(e) => {
              onInsert(ex.body, e.shiftKey)
              onClose()
            }}
            className={
              'text-left rounded-xl border p-3 hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ' +
              (i === idx ? 'ring-2 ring-blue-600' : '')
            }
          >
            <div className="text-sm font-medium">{ex.title}</div>
            {ex.subtitle && <div className="text-xs text-zinc-500">{ex.subtitle}</div>}
            <div className="mt-1 text-xs line-clamp-2 text-zinc-600 dark:text-zinc-300">{ex.body}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

