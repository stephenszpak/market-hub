import { render } from '@testing-library/react'
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
import React from 'react'

const rows = [
  { group: 'A', sessions: 10, conversions: 2 },
  { group: 'B', sessions: 20, conversions: 3 },
]

test('renders line chart preview', () => {
  render(
    <div style={{ width: 400, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <XAxis dataKey="group" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sessions" stroke="#006DA8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

test('renders bar chart preview', () => {
  render(
    <div style={{ width: 400, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <XAxis dataKey="group" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sessions" fill="#006DA8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

test('renders area chart preview', () => {
  render(
    <div style={{ width: 400, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <XAxis dataKey="group" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="sessions" stroke="#006DA8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

