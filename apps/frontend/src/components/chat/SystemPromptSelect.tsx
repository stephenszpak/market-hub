import { useMemo } from 'react'

export type SystemPrompt = { id: string; label: string; value: string }

export function SystemPromptSelect({
  options,
  value,
  onChange,
}: {
  options: SystemPrompt[]
  value: string
  onChange: (id: string) => void
}) {
  const current = useMemo(
    () => options.find((o) => o.id === value) ?? options[0],
    [options, value]
  )

  return (
    <label className="ml-auto inline-flex items-center gap-2 rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-3 py-1.5 text-sm shadow-sm">
      <span className="text-zinc-600 dark:text-zinc-300">System:</span>
      <select
        aria-label="System prompt"
        value={current.id}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

