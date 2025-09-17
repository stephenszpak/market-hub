import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

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
  useEffect(() => {
    const params = new URLSearchParams(loc.search)
    setPrompt(params.get('prompt') || '')
  }, [loc.search])

  return (
    <div>
      {prompt && (
        <div className="mb-4 p-3 rounded border border-gray-200 dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Chart prompt:</div>
          <div className="text-sm">{prompt}</div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
        Demo Chart
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sessions" stroke="#006DA8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="conversions" stroke="#007ABB" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
