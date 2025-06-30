"use client"
import { useEffect, useState } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { fetchDailySpendingTrend } from "@/api/statisticalApi"
import { formatCurrency } from "@/lib/format"

export default function DailySpendingAreaChart({ userId }: { userId: number }) {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchDailySpendingTrend(userId).then(setData).catch(console.error)
  }, [userId])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis tickFormatter={(value) => `${value / 1000}k`} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
