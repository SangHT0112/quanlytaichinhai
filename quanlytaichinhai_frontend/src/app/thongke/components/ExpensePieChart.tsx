"use client"
import { useEffect, useState } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { fetchExpensePieChart } from "@/api/overviewApi"
import { formatCurrency } from "@/lib/format"
import { useUser } from "@/contexts/UserProvider"
interface PieDataItem {
  name: string
  value: number
  color: string
}

interface RawPieData {
  category_name: string;
  total: number | string; // Tuỳ theo backend trả về số hay chuỗi số
}

export default function ExpensePieChart() {
  const [data, setData] = useState<PieDataItem[]>([])
  const user = useUser();
  const userId = user?.user_id
  useEffect(() => {
    if(!userId) return
    fetchExpensePieChart(userId).then((res: RawPieData[]) => {
    const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff88", "#ff0088", "#ffbb28"]
    const formatted = res.map((item, index) => ({
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
