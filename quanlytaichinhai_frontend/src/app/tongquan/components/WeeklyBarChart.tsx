"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { fetchWeeklyExpenses } from "@/api/overviewApi"
import { useUser } from "@/contexts/UserProvider"
import { formatCurrency } from "@/lib/format"
export interface WeeklyExpenseData {
  day: string
  chi: number
}

export default function WeeklyBarChart() {
  const [data, setData] = useState<WeeklyExpenseData[]>([])
  const user = useUser()
  const userId = user?.user_id

  useEffect(() => {
    if (!userId) return

    fetchWeeklyExpenses(userId)
      .then((res: WeeklyExpenseData[]) => {
        const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

        // Nếu API trả về tên ngày dài (Thứ hai, Thứ ba...), đổi sang dạng ngắn
        const dayMap: Record<string, string> = {
          "Thứ hai": "Thứ 2",
          "Thứ ba": "Thứ 3",
          "Thứ tư": "Thứ 4",
          "Thứ năm": "Thứ 5",
          "Thứ sáu": "Thứ 6",
          "Thứ bảy": "Thứ 7",
        }
        const normalized = res.map(item => ({
          ...item,
          day: dayMap[item.day] || item.day
        }))

        // Tạo dữ liệu đủ 7 ngày
        const fullWeek = days.map(day => {
          const found = normalized.find(item => item.day === day)
          return found || { day, chi: 0 }
        })

        setData(fullWeek)
      })
      .catch(console.error)
  }, [userId])

  return (
    <div className="w-130 h-80">
      <h3>Chi tiêu trong tuần</h3>
     <ResponsiveContainer>
      <BarChart data={data}>
        <XAxis dataKey="day" />
        <YAxis
          width={70} // khoảng trống bên trái
          tickFormatter={(value) => formatCurrency(Number(value))}
          tick={{ dx: -4 }} // dịch text sang trái để tránh sát cột
        />
        <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
        <Bar dataKey="chi" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>

    </div>
  )
}
