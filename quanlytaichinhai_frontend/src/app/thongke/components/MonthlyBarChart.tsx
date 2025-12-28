"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { fetchMonthlyIncomeVsExpense } from "@/api/statisticalApi"
import { formatCurrency } from "@/lib/format"
import { useUser } from "@/contexts/UserProvider"
import type { TooltipProps } from "recharts"

export default function MonthlyBarChart({ initialMonths = 3 }: { initialMonths?: number }) {
  const [data, setData] = useState([])
  const [months, setMonths] = useState(initialMonths)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const user = useUser()
  const userId = user?.user_id

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await fetchMonthlyIncomeVsExpense(userId, months)
        setData(result)
      } catch (error) {
        console.error("Lỗi khi fetch thu chi:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, months])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl p-4">
          <p className="text-gray-300 font-medium text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white font-bold text-lg">
              {entry.name}: {formatCurrency(Number(entry.value))}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const incomeGradientId = "incomeGradient"
  const expenseGradientId = "expenseGradient"

  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 rounded-2xl pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}></div>

      <div className="relative z-10">
        {/* Header + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Title Section */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">Thu chi theo tháng</h3>
            <p className="text-gray-400 text-sm font-medium">
              So sánh <span className="text-emerald-400">{months}</span> tháng gần nhất
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="month-select"
              className="text-sm font-medium text-gray-400 whitespace-nowrap"
            >
              Hiển thị:
            </label>
            <div className="relative">
              <select
                id="month-select"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                disabled={isLoading}
                className="appearance-none bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-300 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <option value={2}>2 tháng</option>
                <option value={3}>3 tháng</option>
                <option value={4}>4 tháng</option>
                <option value={5}>5 tháng</option>
                <option value={6}>6 tháng</option>
                <option value={12}>12 tháng</option>
              </select>
              {/* Custom arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="mt-6 flex justify-center items-center h-64 text-gray-400">
            Không có dữ liệu
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div style={{ width: `${months * 120}px`, minWidth: "100%" }}>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 40 }} barCategoryGap="20%">
                  <defs>
                    <linearGradient id={incomeGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id={expenseGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
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
                    tickFormatter={(value) => `${value / 1000000}M`}
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
                    labelFormatter={(month) => `Tháng ${month}`}
                  />
                  <Bar
                    dataKey="income"
                    name="Thu nhập"
                    radius={[6, 6, 0, 0]}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`income-${index}`}
                        fill={`url(#${incomeGradientId})`}
                        className="transition-all duration-300"
                        style={{
                          filter:
                            hoveredIndex === index
                              ? "drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))"
                              : "none",
                          transform: hoveredIndex === index ? "scaleY(1.05)" : "scaleY(1)",
                          transformOrigin: "bottom",
                          opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.6,
                        }}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expense"
                    name="Chi tiêu"
                    radius={[6, 6, 0, 0]}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`expense-${index}`}
                        fill={`url(#${expenseGradientId})`}
                        className="transition-all duration-300"
                        style={{
                          filter:
                            hoveredIndex === index
                              ? "drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))"
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
          </div>
        )}

        {/* Legend */}
        {!isLoading && data.length > 0 && (
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ 
                  backgroundImage: `linear-gradient(to bottom, #10B981, #059669)`
                }}
              />
              <span className="text-gray-400 text-sm font-medium">Thu nhập</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ 
                  backgroundImage: `linear-gradient(to bottom, #EF4444, #DC2626)`
                }}
              />
              <span className="text-gray-400 text-sm font-medium">Chi tiêu</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}