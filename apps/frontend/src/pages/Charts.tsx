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

export default function Charts() {
  const loc = useLocation()
  const [prompt, setPrompt] = useState<string>('')
  const [rows, setRows] = useState<any[]>([])
  const [spec, setSpec] = useState<any | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [explanation, setExplanation] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState<{id:number; chart_spec:any; inserted_at:string}[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [slidesTitle, setSlidesTitle] = useState('Marketing Performance')
  const [slidesDateRange, setSlidesDateRange] = useState('Last 30 days')
  const [brandLogo, setBrandLogo] = useState<string>('')
  const [bullets, setBullets] = useState<Record<number, string>>({})

  async function downloadPdf() {
    if (selectedIds.length === 0) return
    const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
    const body = { title: slidesTitle || 'Charts', chartIds: selectedIds }
    const res = await fetch(base.replace(/\/$/, '') + '/api/charts/pdf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (slidesTitle || 'Charts') + '.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return
    const ok = window.confirm(`Delete ${selectedIds.length} chart(s)? This cannot be undone.`)
    if (!ok) return
    const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
    await fetch(base.replace(/\/$/, '') + '/api/charts/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chartIds: selectedIds })
    })
    // Refresh list
    const res = await fetch(base.replace(/\/$/, '') + '/api/charts')
    const json = await res.json()
    setSaved(json.charts || [])
    setSelectedIds([])
  }
  useEffect(() => {
    const params = new URLSearchParams(loc.search)
    setPrompt(params.get('prompt') || '')
  }, [loc.search])

  useEffect(() => {
    ;(async () => {
      const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
      const res = await fetch(base.replace(/\/$/, '') + '/api/charts')
      const json = await res.json()
      setSaved(json.charts || [])
    })()
  }, [])

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

  function toggleSelected(id: number) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function generateSlides(saveToExports?: boolean) {
    if (selectedIds.length === 0) return
    const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000'
    const bulletsByChartId: Record<number, string[]> = {}
    selectedIds.forEach((id) => {
      const text = bullets[id] || ''
      bulletsByChartId[id] = text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    })
    const body = {
      title: slidesTitle,
      chartIds: selectedIds,
      bulletsByChartId,
      dateRange: slidesDateRange,
      brand: brandLogo ? { logoUrl: brandLogo } : {},
      save: !!saveToExports,
    }
    const res = await fetch(base.replace(/\/$/, '') + '/api/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'slides.pptx'
    a.click()
    URL.revokeObjectURL(url)
  }

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

      <div className="border rounded p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Saved Charts</div>
          <div className="flex gap-2">
            <button className="rounded px-3 py-1.5 border" disabled={selectedIds.length === 0} onClick={downloadPdf}>Download PDF</button>
            <button className="rounded px-3 py-1.5 border" disabled={selectedIds.length === 0} onClick={() => setDrawerOpen(true)}>Generate Slides</button>
            <button className="rounded px-3 py-1.5 border text-red-600 border-red-300 disabled:opacity-50" disabled={selectedIds.length === 0} onClick={deleteSelected}>Delete</button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {saved.map((c) => (
            <label key={c.id} className="flex items-start gap-2 rounded border p-2">
              <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelected(c.id)} />
              <div className="text-xs">
                <div className="font-medium">Chart #{c.id}</div>
                <div className="text-zinc-500">{new Date(c.inserted_at).toLocaleString()}</div>
              </div>
            </label>
          ))}
          {saved.length === 0 && <div className="text-sm text-zinc-500">No saved charts yet.</div>}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-30" onClick={() => setDrawerOpen(false)}>
          <div className="w-[min(560px,95vw)] h-full bg-white dark:bg-zinc-900 p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Generate Slides</div>
              <button className="rounded px-3 py-1.5 border" onClick={() => setDrawerOpen(false)}>Close</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block mb-1">Title</label>
                <input className="w-full rounded border px-2 py-1" value={slidesTitle} onChange={(e) => setSlidesTitle(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1">Date Range</label>
                <input className="w-full rounded border px-2 py-1" value={slidesDateRange} onChange={(e) => setSlidesDateRange(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1">Brand Logo (URL or upload)</label>
                <div className="flex gap-2">
                  <input className="flex-1 rounded border px-2 py-1" placeholder="https://..." value={brandLogo} onChange={(e) => setBrandLogo(e.target.value)} />
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = () => setBrandLogo(reader.result as string)
                      reader.readAsDataURL(f)
                    }
                  }} />
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="font-medium mb-2">Bullets per chart (one per line)</div>
                <div className="space-y-2">
                  {selectedIds.map((id) => (
                    <div key={id}>
                      <div className="text-xs font-medium mb-1">Chart #{id}</div>
                      <textarea rows={3} className="w-full rounded border px-2 py-1" value={bullets[id] || ''} onChange={(e) => setBullets((b) => ({ ...b, [id]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="rounded px-3 py-2 bg-blue-600 text-white" onClick={() => generateSlides(false)}>Generate</button>
                <button className="rounded px-3 py-2 border" onClick={() => generateSlides(true)}>Save to /exports</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
