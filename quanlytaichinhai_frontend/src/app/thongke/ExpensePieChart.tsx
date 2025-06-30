"use client"
import { useEffect, useState } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { fetchExpensePieChart } from "@/api/overviewApi"
import { formatCurrency } from "@/lib/format"
interface PieDataItem {
  name: string
  value: number
  color: string
}
export default function ExpensePieChart({ userId }: { userId: number }) {
  const [data, setData] = useState<PieDataItem[]>([])

  useEffect(() => {
    fetchExpensePieChart(userId).then((res) => {
      const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff88", "#ff0088", "#ffbb28"]
      const formatted = res.map((item: any, index: number) => ({
        name: item.category_name,
        value: Number(item.total),
        color: COLORS[index % COLORS.length],
      }))
      setData(formatted)
    })
  }, [userId])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  )
}
