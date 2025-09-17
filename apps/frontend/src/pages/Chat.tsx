import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
  ts: number
  context_meta?: any
}

const SYSTEMS = [
  { key: 'General', value: 'You are a helpful analytics assistant.' },
  { key: 'Attribution', value: 'You analyze attribution across channels and campaigns.' },
  { key: 'Campaign performance', value: 'You focus on campaign performance KPIs.' },
]

const EXAMPLES = [
  'Top 5 campaigns by conversions in the last 30 days',
  'Sessions and conversions by channel last month',
  'Which region drove the highest revenue in the past 30 days?',
  'Summarize overall campaign performance trends',
  'Which campaigns underperformed on conversion rate?'
]

export default function Chat() {
  const [systemKey, setSystemKey] = useState('General')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [lastContext, setLastContext] = useState<any | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const nav = useNavigate()

  const system = useMemo(() => SYSTEMS.find(s => s.key === systemKey)?.value || SYSTEMS[0].value, [systemKey])

  useEffect(() => () => esRef.current?.close(), [])

  async function send() {
    if (!question.trim() || loading) return
    setError(null)
    setLoading(true)
    const userMsg: Message = { role: 'user', content: question, ts: Date.now() }
    setMessages(m => [...m, userMsg])
    setQuestion('')

    try {
      const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
      const url = new URL(base.replace(/\/$/, '') + '/api/chat/stream')
      url.searchParams.set('question', userMsg.content)
      url.searchParams.set('system', system)

      let assistant: Message = { role: 'assistant', content: '', ts: Date.now() }
      setMessages(m => [...m, assistant])

      const es = new EventSource(url.toString())
      esRef.current = es
      es.addEventListener('meta', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data)
          if (payload.context_meta) setLastContext(payload.context_meta)
        } catch {}
      })
      es.addEventListener('delta', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data)
          const ch: string = payload.content || ''
          assistant = { ...assistant, content: (assistant.content || '') + ch }
          setMessages(m => {
            const copy = [...m]
            copy[copy.length - 1] = assistant
            return copy
          })
        } catch {}
      })
      es.addEventListener('done', () => {
        setLoading(false)
        es.close()
        esRef.current = null
      })
      es.onerror = () => {
        setError('Stream error')
        setLoading(false)
        es.close()
        esRef.current = null
      }
    } catch (e: any) {
      setError(e?.message || 'Error')
      setLoading(false)
    }
  }

  function stop() {
    esRef.current?.close()
    setLoading(false)
  }

  function chooseExample(p: string) {
    setQuestion(q => (q ? `${q} ${p}` : p))
    inputRef.current?.focus()
  }

  function useAsChartPrompt(text: string) {
    nav(`/charts?prompt=${encodeURIComponent(text)}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">System prompt:</label>
          <select
            value={systemKey}
            onChange={e => setSystemKey(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
          >
            {SYSTEMS.map(s => (
              <option key={s.key} value={s.key}>{s.key}</option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded p-3 h-[60vh] overflow-auto space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className="border-b border-gray-100 dark:border-gray-800 pb-2">
              <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'User' : 'AI'} • {new Date(m.ts).toLocaleTimeString()}</div>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
              <div className="mt-2">
                <button
                  onClick={() => useAsChartPrompt(m.content)}
                  className="text-sm px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Use as chart prompt
                </button>
              </div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-sm text-gray-500">Ask something about campaigns, channels, or regions to see data context used.</div>}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
            placeholder="Ask a question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
          />
          {!loading ? (
            <button onClick={send} className="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Send</button>
          ) : (
            <button onClick={stop} className="px-4 py-2 rounded border">Stop</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-gray-500">Try:</span>
          {EXAMPLES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => chooseExample(p)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {p}
            </button>
          ))}
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="lg:col-span-1">
        <div className="border border-gray-200 dark:border-gray-800 rounded p-3">
          <div className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Data context</div>
          {lastContext ? (
            <div className="text-sm space-y-1">
              <div><span className="text-gray-500">table:</span> {lastContext.context_table || '—'}</div>
              <div><span className="text-gray-500">rows_shown:</span> {Array.isArray(lastContext.rows_shown) ? lastContext.rows_shown.length : 0}</div>
              {lastContext.sql_used && (
                <div className="overflow-auto"><span className="text-gray-500">sql:</span><pre className="whitespace-pre-wrap text-xs">{lastContext.sql_used}</pre></div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data context yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
