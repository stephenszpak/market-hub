import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SystemPromptSelect, type SystemPrompt } from '../components/chat/SystemPromptSelect'
import { ExamplePromptPopover, type ExamplePrompt } from '../components/chat/ExamplePromptPopover'
import { DataContextPopover } from '../components/chat/DataContextPopover'
import { ChatInput } from '../components/chat/ChatInput'

type Message = {
  role: 'user' | 'assistant'
  content: string
  ts: number
  context_meta?: any
}

const DEFAULT_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'friendly',
    label: 'Friendly helper',
    value:
      'You are a friendly, concise assistant for marketing stakeholders. Avoid code unless asked. Use plain language, short sections, and small Markdown tables when helpful.',
  },
  {
    id: 'attribution',
    label: 'Attribution',
    value:
      'Analyze and attribute marketing performance. Avoid code; focus on insights. Use Markdown with sections: Summary, Key Drivers, Data Caveats, Next Actions. Include a small table if needed.',
  },
  { id: 'engineering', label: 'Engineering', value: 'You are a senior engineer. Prefer code, minimal prose, show runnable examples.' },
]

const DEFAULT_EXAMPLES: ExamplePrompt[] = [
  { id: 'top-campaigns', title: 'Top campaigns last 30 days', subtitle: 'Conversions by campaign', body: 'List the top 5 campaigns by conversions in the last 30 days. Return a brief Markdown table and one-sentence insight.' },
  { id: 'sessions-by-channel', title: 'Sessions by channel', subtitle: 'Last month', body: 'Break down sessions and conversions by marketing channel for last month. Include a short commentary on outliers.' },
  { id: 'highest-revenue-region', title: 'Highest revenue region', subtitle: 'Past 30 days', body: 'Which region drove the highest revenue in the past 30 days? Include revenue amount and a one-line explanation.' },
  { id: 'underperformers', title: 'Underperforming campaigns', subtitle: 'Conversion rate', body: 'Which campaigns underperformed on conversion rate compared to the median? Provide 2–3 hypotheses.' },
  { id: 'summary-trends', title: 'Summarize trends', subtitle: 'Overall performance', body: 'Summarize overall campaign performance trends in the last 6 weeks. Include top wins and risks.' },
]

export default function Chat() {
  const [selectedSysPromptId, setSelectedSysPromptId] = useState<string>('friendly')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [lastContext, setLastContext] = useState<any | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const nav = useNavigate()
  const plusRef = useRef<HTMLButtonElement>(null)
  const infoRef = useRef<HTMLButtonElement>(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sysPrompt')
      if (saved && DEFAULT_SYSTEM_PROMPTS.some(o => o.id === saved)) setSelectedSysPromptId(saved)
    } catch {}
  }, [])

  useEffect(() => () => esRef.current?.close(), [])

  const selectedSystem = useMemo(() => (
    DEFAULT_SYSTEM_PROMPTS.find(p => p.id === selectedSysPromptId)?.value || DEFAULT_SYSTEM_PROMPTS[0].value
  ), [selectedSysPromptId])

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
      url.searchParams.set('system', selectedSystem)

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

  function onInsertExample(body: string, append?: boolean) {
    setQuestion(prev => (append && prev ? prev + "\n\n" + body : body))
    setExamplesOpen(false)
    plusRef.current?.focus()
  }

  function goToChartPrompt(text: string) {
    nav(`/charts?prompt=${encodeURIComponent(text)}`)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-2 py-1">
        <div className="text-sm text-gray-600 dark:text-gray-400">Chat</div>
        <div className="ml-auto">
          <SystemPromptSelect
            options={DEFAULT_SYSTEM_PROMPTS}
            value={selectedSysPromptId}
            onChange={(id) => { setSelectedSysPromptId(id); try { localStorage.setItem('sysPrompt', id) } catch {} }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`animate-fadeIn flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.role === 'user' ? 'bg-blue-50 border border-blue-100 text-gray-900' : 'bg-white border text-gray-900'} dark:${m.role === 'user' ? 'bg-blue-900/30 border-blue-800 text-gray-100' : 'bg-zinc-900 border-zinc-800 text-gray-100'} max-w-[min(720px,90%)] rounded-2xl px-4 py-3 shadow-sm` }>
              <div className="text-xs text-zinc-500 mb-1">{m.role === 'user' ? 'You' : 'Assistant'} • {new Date(m.ts).toLocaleTimeString()}</div>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none md-code">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({inline, className: _className, children, ...props}) {
                        const text = String(children)
                        if (inline) {
                          return <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800" {...props}>{children}</code>
                        }
                        const copy = () => navigator.clipboard.writeText(text)
                        return (
                          <div className="relative">
                            <button onClick={copy} className="absolute right-2 top-2 text-xs px-2 py-1 rounded bg-zinc-700 text-white">Copy</button>
                            <pre className="rounded-lg bg-zinc-900 text-zinc-100 p-3 overflow-auto"><code>{text}</code></pre>
                          </div>
                        )
                      }
                    }}
                  >{m.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="font-medium whitespace-pre-wrap">{m.content}</div>
              )}
              <div className="mt-2">
                <button
                  onClick={() => goToChartPrompt(m.content)}
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Use as chart prompt
                </button>
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 p-3">Ask something about campaigns, channels, or regions to see data context used.</div>
        )}
        {loading && (
          <div className="flex items-center gap-1 text-zinc-500 text-sm px-3">
            <span className="animate-bounce" style={{animationDelay:'0ms'}}>•</span>
            <span className="animate-bounce" style={{animationDelay:'150ms'}}>•</span>
            <span className="animate-bounce" style={{animationDelay:'300ms'}}>•</span>
          </div>
        )}
      </div>

      <div className="px-2 pb-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {DEFAULT_EXAMPLES.slice(0,4).map(ex => (
            <button key={ex.id} onClick={() => onInsertExample(ex.body)} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
              {ex.title}
            </button>
          ))}
        </div>
        <div className="relative">
          <ChatInput
            value={question}
            onChange={setQuestion}
            onSend={loading ? stop : send}
            disabled={loading}
            onToggleExamples={() => setExamplesOpen(o => !o)}
            examplesOpen={examplesOpen}
            anchorRef={plusRef}
            onToggleContext={() => setContextOpen(o => !o)}
            contextOpen={contextOpen}
            contextAnchorRef={infoRef}
          />
          <ExamplePromptPopover
            examples={DEFAULT_EXAMPLES}
            open={examplesOpen}
            onClose={() => setExamplesOpen(false)}
            onInsert={onInsertExample}
            anchorRef={plusRef as any}
          />
          <DataContextPopover
            open={contextOpen}
            onClose={() => setContextOpen(false)}
            anchorRef={infoRef as any}
            context={lastContext}
          />
        </div>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  )
}
