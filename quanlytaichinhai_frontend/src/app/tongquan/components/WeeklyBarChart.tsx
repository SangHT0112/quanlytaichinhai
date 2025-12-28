"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { fetchWeeklyExpenses } from "@/api/overviewApi"
import { useUser } from "@/contexts/UserProvider"
import { formatCurrency } from "@/lib/format"
import type { TooltipProps } from "recharts"

export interface WeeklyExpenseData {
  day: string
  chi: number
}

export default function WeeklyBarChart() {
  const [data, setData] = useState<WeeklyExpenseData[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const user = useUser()
  const userId = user?.user_id

  useEffect(() => {
    if (!userId) return

    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

    const dayMap: Record<string, string> = {
      "Thứ hai": "Thứ 2",
      "Thứ ba": "Thứ 3",
      "Thứ tư": "Thứ 4",
      "Thứ năm": "Thứ 5",
      "Thứ sáu": "Thứ 6",
      "Thứ bảy": "Thứ 7",
      "Chủ nhật": "Chủ nhật",
    }

    fetchWeeklyExpenses(userId)
      .then((res: WeeklyExpenseData[]) => {
        const normalized = res.map((item) => ({
          ...item,
          day: dayMap[item.day.trim()] || item.day.trim(),
        }))

        const fullWeek = days.map((day) => {
          const found = normalized.find((item) => item.day.trim() === day.trim())
          return found || { day, chi: 0 }
        })

        setData(fullWeek)
      })
      .catch((error) => {
        console.error("Fetch error:", error)
        setData(days.map((day) => ({ day, chi: 0 })))
      })
  }, [userId])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl p-4">
          <p className="text-gray-300 font-medium text-sm mb-1">{label}</p>
          <p className="text-white font-bold text-lg">
            {formatCurrency(payload[0].value as number)}
          </p>
        </div>
      )
    }
    return null
  }

  const barColors = [
    "url(#colorGradient0)",
    "url(#colorGradient1)",
    "url(#colorGradient2)",
    "url(#colorGradient3)",
    "url(#colorGradient4)",
    "url(#colorGradient5)",
    "url(#colorGradient6)",
  ]

  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 rounded-2xl pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-white">
            Chi tiêu trong tuần
          </h3>
          <div className="text-gray-400 text-sm font-medium">
            Tuần này
          </div>
        </div>

        <div className="w-full h-[450px]">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
              <defs>
                <linearGradient id="colorGradient0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity={1} />
                  <stop offset="100%" stopColor="#DB2777" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorGradient4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorGradient5" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorGradient6" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                interval={0}
                tick={{ 
                  fill: "#9CA3AF", 
                  fontSize: 13, 
                  fontWeight: 500,
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
                axisLine={{ 
                  stroke: "#374151", 
                  strokeWidth: 1 
                }}
                tickLine={{ 
                  stroke: "#374151" 
                }}
              />
              <YAxis
                width={80}
                tickFormatter={(value) => formatCurrency(Number(value))}
                tick={{ 
                  fill: "#9CA3AF", 
                  fontSize: 12, 
                  fontWeight: 500,
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
                axisLine={{ 
                  stroke: "#374151", 
                  strokeWidth: 1 
                }}
                tickLine={{ 
                  stroke: "#374151" 
                }}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ 
                  fill: "rgba(255, 255, 255, 0.05)" 
                }} 
              />

              <Bar
                dataKey="chi"
                radius={[6, 6, 0, 0]}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[index]}
                    className="transition-all duration-300"
                    style={{
                      filter:
                        hoveredIndex === index
                          ? "drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))"
                          : "none",
                      transform: hoveredIndex === index ? "scaleY(1.05)" : "scaleY(1)",
                      transformOrigin: "bottom",
                      opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.6,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-6">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ 
                  background: barColors[index].replace('url(#', '').replace(')', ''),
                  backgroundImage: `linear-gradient(to bottom, ${
                    index === 0 ? '#3B82F6, #1D4ED8' :
                    index === 1 ? '#8B5CF6, #7C3AED' :
                    index === 2 ? '#EC4899, #DB2777' :
                    index === 3 ? '#10B981, #059669' :
                    index === 4 ? '#F59E0B, #D97706' :
                    index === 5 ? '#EF4444, #DC2626' :
                    '#6366F1, #4F46E5'
                  })`
                }}
              />
              <span className="text-gray-400 text-sm font-medium">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}