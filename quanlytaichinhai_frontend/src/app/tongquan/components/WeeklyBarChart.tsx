"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { fetchWeeklyExpenses } from "@/api/overviewApi"
import { useUser } from "@/contexts/UserProvider"
import { formatCurrency } from "@/lib/format"
import { TooltipProps } from "recharts"
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
        const normalized = res.map((item) => ({
          ...item,
          day: dayMap[item.day] || item.day,
        }))

        // Tạo dữ liệu đủ 7 ngày
        const fullWeek = days.map((day) => {
          const found = normalized.find((item) => item.day === day)
          return found || { day, chi: 0 }
        })

        setData(fullWeek)
      })
      .catch(console.error)
  }, [userId])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-gray-900 font-medium">{label}</p>
          <p className="text-blue-600 font-semibold">
            Chi tiêu: {formatCurrency(payload[0].value as number)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiêu trong tuần</h3>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis
              dataKey="day"
              tick={{ fill: "#374151", fontSize: 12 }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={{ stroke: "#D1D5DB" }}
            />
            <YAxis
              width={70}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ dx: -4, fill: "#374151", fontSize: 12 }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={{ stroke: "#D1D5DB" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="chi" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
