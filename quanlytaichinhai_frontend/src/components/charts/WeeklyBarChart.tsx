"use client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { fetchWeeklyExpenses } from "@/api/overviewApi"
import { formatCurrency } from "@/lib/format"

export default function WeeklyBarChart() {
  const [data, setData] = useState<any[]>([])
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if(!userStr) return
    const userId = JSON.parse(userStr).user_id

    fetchWeeklyExpenses(userId)
    .then((res) =>{
      console.log("Dữ liệu tuần:", res)
      setData(res)
    })
    .catch((err) => {
      console.error("Lỗi biểu đồ tuần:", err)
    })
  }, [])
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
        >
          <XAxis dataKey="day" />
          <YAxis tickFormatter={(value) => formatCurrency(Number(value))}/>
          <Tooltip formatter={(value:number)=> formatCurrency(Number(value))} />
          <Bar dataKey="chi" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
