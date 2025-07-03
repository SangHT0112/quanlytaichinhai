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
} from "recharts"
import { fetchMonthlyIncomeVsExpense } from "@/api/statisticalApi"
import { formatCurrency } from "@/lib/format"

export default function MonthlyBarChart({
  userId,
  initialMonths = 3,
}: {
  userId: number
  initialMonths?: number
}) {
  const [data, setData] = useState([])
  const [months, setMonths] = useState(initialMonths)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await fetchMonthlyIncomeVsExpense(userId, months)
        setData(result)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, months])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title Section */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Biểu đồ thu chi theo tháng</h3>
          <p className="text-sm text-gray-600">
            So sánh <span className="font-medium text-blue-600">{months}</span> tháng gần nhất
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="month-select"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Hiển thị:
          </label>
          <div className="relative">
            <select
              id="month-select"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              disabled={isLoading}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                className="w-4 h-4 text-gray-400"
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
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="mt-6 flex justify-center items-center h-64 text-gray-500">
          Không có dữ liệu
        </div>
      ) : (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(month) => `Tháng ${month}`}
              />
              <Bar dataKey="income" fill="#22c55e" name="Thu nhập" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Chi tiêu" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
