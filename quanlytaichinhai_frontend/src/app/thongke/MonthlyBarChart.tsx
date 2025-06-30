"use client"
import { useEffect, useState } from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { fetchMonthlyIncomeVsExpense } from "@/api/statisticalApi"
import { formatCurrency } from "@/lib/format"

export default function MonthlyBarChart({ userId }: { userId: number }) {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchMonthlyIncomeVsExpense(userId).then(setData).catch(console.error)
  }, [userId])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar dataKey="income" fill="#22c55e" name="Thu nhập" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" name="Chi tiêu" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
