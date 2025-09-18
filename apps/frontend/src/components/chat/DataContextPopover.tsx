import { useEffect, useRef } from 'react'

export function DataContextPopover({
  open,
  onClose,
  anchorRef,
  context,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
  context: any
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current && anchorRef.current.contains(t as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute bottom-14 right-12 z-20 w-[min(560px,95vw)] rounded-2xl border bg-white dark:bg-zinc-900 shadow-xl p-3 text-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="font-medium mb-2">Data context</div>
      {context ? (
        <div className="space-y-1">
          <div>
            <span className="text-zinc-500">table:</span> {context.context_table || '—'}
          </div>
          <div>
            <span className="text-zinc-500">rows_shown:</span> {Array.isArray(context.rows_shown) ? context.rows_shown.length : 0}
          </div>
          {context.sql_used && (
            <div className="overflow-auto">
              <span className="text-zinc-500">sql:</span>
              <pre className="whitespace-pre-wrap text-xs mt-1">{context.sql_used}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="text-zinc-500">No data context yet.</div>
      )}
    </div>
  )
}

