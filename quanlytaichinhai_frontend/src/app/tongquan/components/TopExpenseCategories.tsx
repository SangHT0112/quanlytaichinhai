"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format"
import { fetchTopCategories } from "@/api/overviewApi"
import { useUser } from "@/contexts/UserProvider"

interface TopCategory {
  category_name: string
  total: number
  icon: string
}

export default function TopExpenseCategories() {
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [timeframe, setTimeframe] = useState("current_month")
  const user = useUser()
  const userId = user?.user_id

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      try {
        const data = await fetchTopCategories(userId, timeframe)
        setTopCategories(data)
      } catch (err) {
        console.error("Lỗi khi lấy top danh mục:", err)
      }
    }

    fetchData()
  }, [userId, timeframe])

  return (
    <div className="space-y-3 bg-white p-4 rounded-xl shadow border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        {/* Icon bên trái */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Top danh mục chi tiêu</h3>
        </div>

        {/* Dropdown bên phải */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white text-gray-900 text-sm rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="current_month">Tháng này</option>
          <option value="last_month">Tháng trước</option>
          <option value="current_week">Tuần này</option>
        </select>
      </div>

      {topCategories.length > 0 ? (
        topCategories.map((cat, idx) => (
          <div
            key={idx}
            className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-[1.02] border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">
                <span>{cat.icon}</span>
              </div>
              <div>
                <span className="text-gray-900 font-medium text-base">{cat.category_name}</span>
                <div className="text-gray-600 text-sm">#{idx + 1} chi tiêu cao nhất</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-red-500 font-bold text-lg">{formatCurrency(Number(cat.total))}</div>
              <div className="text-gray-500 text-xs">
                {((cat.total / topCategories.reduce((sum, c) => sum + c.total, 0)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-gray-400">📝</span>
          </div>
          <p className="text-gray-600 text-lg font-medium">Không có dữ liệu</p>
          <p className="text-gray-500 text-sm mt-1">Hãy thêm chi tiêu để xem thống kê</p>
        </div>
      )}
    </div>
  )
}
