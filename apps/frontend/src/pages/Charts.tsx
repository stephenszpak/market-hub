import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

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
  return (
    <div>
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
