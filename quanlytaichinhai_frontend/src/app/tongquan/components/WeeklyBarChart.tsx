"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"
import { fetchWeeklyExpenses } from "@/api/overviewApi"
import { formatCurrency } from "@/lib/format"
import { useUser } from "@/contexts/UserProvider"

export interface WeeklyExpenseData {
  day: string
  chi: number
}

// Màu sắc gradient cho từng cột
const colors = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#84CC16", // Lime
]

export default function WeeklyBarChart() {
  const [data, setData] = useState<WeeklyExpenseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const user = useUser()
  const userId = user?.user_id

  useEffect(() => {
    if (!userId) return

    setIsLoading(true)
    fetchWeeklyExpenses(userId)
      .then((res: WeeklyExpenseData[]) => {
        // Chuẩn hóa tên các ngày trong tuần
        const dayNameMap: Record<string, string> = {
          "Thứ hai": "Thứ 2",
          "Thứ ba": "Thứ 3",
          "Thứ tư": "Thứ 4",
          "Thứ năm": "Thứ 5",
          "Thứ sáu": "Thứ 6",
          "Thứ bảy": "Thứ 7",
        }

        const processedData = res.map((item) => ({
          ...item,
          day: dayNameMap[item.day] || item.day,
        }))

        // Tạo dữ liệu đầy đủ cho cả tuần
        const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
        const fullWeekData = days.map((day) => {
          const found = processedData.find((item) => item.day === day)
          return found || { day, chi: 0 }
        })

        setData(fullWeekData)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [userId])

  const maxValue = Math.max(...data.map((d) => d.chi))
  const totalExpense = data.reduce((sum, item) => sum + item.chi, 0)

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="mb-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3"></div>
        </div>
        <div className="h-80 bg-gray-50 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Chi tiêu trong tuần</h2>
       <p className="text-sm text-gray-600">
        Tổng chi tiêu: <span className="font-semibold text-blue-600">{formatCurrency(totalExpense)}</span><br />
        Trung bình: <span className="font-semibold text-blue-600">{formatCurrency(totalExpense / data.length)}</span>
      </p>

      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 20 }} barCategoryGap="25%">
              <defs>
                {colors.map((color, index) => (
                  <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} vertical={false} />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 13,
                  fontWeight: 600,
                  fill: "#374151",
                }}
                tickMargin={12}
              />

              <YAxis
                domain={[0, maxValue * 1.15]}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fontWeight: 500,
                  fill: "#6B7280",
                }}
                tickFormatter={(value) => formatCurrency(Number(value))}
                width={100}
                tickMargin={8}
              />

              <Tooltip
                formatter={(value: number) => [formatCurrency(Number(value)), "Chi tiêu"]}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  fontSize: "14px",
                  fontWeight: "500",
                  padding: "12px 16px",
                }}
                labelStyle={{
                  color: "#111827",
                  fontWeight: "600",
                  marginBottom: "4px",
                }}
                cursor={{
                  fill: "rgba(59, 130, 246, 0.05)",
                  radius: 8,
                }}
              />

              <Bar dataKey="chi" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#gradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{formatCurrency(Math.max(...data.map((d) => d.chi)))}</p>
              <p className="text-xs font-medium text-blue-500 mt-1">Cao nhất</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(Math.min(...data.filter((d) => d.chi > 0).map((d) => d.chi)))}
              </p>
              <p className="text-xs font-medium text-green-500 mt-1">Thấp nhất</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-lg font-bold text-amber-600">{formatCurrency(totalExpense / data.length)}</p>
              <p className="text-xs font-medium text-amber-500 mt-1">Trung bình</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{data.filter((d) => d.chi > 0).length}</p>
              <p className="text-xs font-medium text-purple-500 mt-1">Ngày có chi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
