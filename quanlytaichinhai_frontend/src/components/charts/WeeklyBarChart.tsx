"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { day: "T2", chi: 500000 },
  { day: "T3", chi: 750000 },
  { day: "T4", chi: 300000 },
  { day: "T5", chi: 900000 },
  { day: "T6", chi: 400000 },
  { day: "T7", chi: 650000 },
  { day: "CN", chi: 500000 },
]

export default function WeeklyBarChart() {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="chi" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
