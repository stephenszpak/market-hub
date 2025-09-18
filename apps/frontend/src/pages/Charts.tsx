import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import html2canvas from 'html2canvas'

const data = [
  { name: 'Mon', sessions: 120, conversions: 12 },
  { name: 'Tue', sessions: 200, conversions: 18 },
  { name: 'Wed', sessions: 150, conversions: 15 },
  { name: 'Thu', sessions: 220, conversions: 22 },
  { name: 'Fri', sessions: 300, conversions: 30 },
  { name: 'Sat', sessions: 180, conversions: 16 },
  { name: 'Sun', sessions: 140, conversions: 11 },
]

export default function Charts() {
  const loc = useLocation()
  const [prompt, setPrompt] = useState<string>('')
  const [rows, setRows] = useState<any[]>([])
  const [spec, setSpec] = useState<any | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [explanation, setExplanation] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const params = new URLSearchParams(loc.search)
    setPrompt(params.get('prompt') || '')
  }, [loc.search])

  async function generate() {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
      const res = await fetch(base.replace(/\/$/, '') + '/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const json = await res.json()
      setRows(json.rows || [])
      setSpec(json.chart_spec || null)
      setChoices(json.choices || [])
      setExplanation(json.explanation || '')
    } finally {
      setLoading(false)
    }
  }

  async function saveCard() {
    if (!spec || !chartRef.current) return
    const canvas = await html2canvas(chartRef.current)
    const dataUrl = canvas.toDataURL('image/png')
    const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
    await fetch(base.replace(/\/$/, '') + '/api/charts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart_spec: spec, query_meta: { prompt }, thumbnail: dataUrl }),
    })
    alert('Saved')
  }

  const yFields: string[] = useMemo(() => spec?.yFields || ['sessions', 'conversions'], [spec])
  const xField: string = useMemo(() => spec?.xField || 'group', [spec])
  const type: string = useMemo(() => spec?.type || 'line', [spec])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Prompt to Chart</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Describe the chart you want..."
        />
        <div className="mt-2 flex gap-2">
          <button className="rounded px-3 py-2 bg-blue-600 text-white disabled:opacity-50" disabled={loading} onClick={generate}>
            Generate Chart
          </button>
          <button className="rounded px-3 py-2 border" onClick={saveCard} disabled={!spec}>
            Save Chart Card
          </button>
        </div>
        {choices.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="text-zinc-500">Did you mean:</span>
            {choices.map((c) => (
              <button key={c} className="px-2 py-1 rounded-full border" onClick={() => setPrompt((p) => (p ? p + ' ' + c : c))}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {spec && (
        <div className="space-y-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">{explanation}</div>
          <div className="w-full h-80 border rounded" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              {type === 'line' && (
                <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xField} />
                  <YAxis />
                  <Tooltip />
                  {yFields.map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={i % 2 === 0 ? '#006DA8' : '#007ABB'} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              )}
              {type === 'bar' && (
                <BarChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xField} />
                  <YAxis />
                  <Tooltip />
                  {yFields.map((k, i) => (
                    <Bar key={k} dataKey={k} fill={i % 2 === 0 ? '#006DA8' : '#007ABB'} />
                  ))}
                </BarChart>
              )}
              {type === 'area' && (
                <AreaChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xField} />
                  <YAxis />
                  <Tooltip />
                  {yFields.map((k, i) => (
                    <Area key={k} type="monotone" dataKey={k} stroke={i % 2 === 0 ? '#006DA8' : '#007ABB'} fillOpacity={0.2} fill={i % 2 === 0 ? '#006DA8' : '#007ABB'} />
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-zinc-500">Chart type: {type} • x: {xField} • y: {yFields.join(', ')}</div>
        </div>
      )}
    </div>
  )
}
