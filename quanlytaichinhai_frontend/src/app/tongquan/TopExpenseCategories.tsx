"use client"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format"
import { fetchTopCategories } from "@/api/overviewApi"
interface Props {
  userId: number
}

export default function TopExpenseCategories({ userId }: Props) {
 const [topCategories, setTopCategories] = useState<any[]>([])
  const [timeframe, setTimeframe] = useState("current_month")

  useEffect(() => {
    if (!userId) return
    const fetchData = async () => {
      try {
        const data = await fetchTopCategories(userId, timeframe)
        setTopCategories(data)
      } catch (err) {
        console.error("L    ỗi khi lấy top danh mục:", err)
      }
    }
    fetchData()
  }, [userId, timeframe])

  return (
    <div className="space-y-3 bg-zinc-800 p-4 rounded-xl shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <span className="text-lg">📊</span>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-white">Top danh mục chi tiêu</h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-zinc-700 text-white text-sm rounded px-2 py-1 ml-2"
          >
            <option value="current_month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
            <option value="current_week">Tuần này</option>
          </select>
        </div>
      </div>

      {topCategories.length > 0 ? (
        topCategories.map((cat, idx) => (
          <div
            key={idx}
            className="group flex items-center justify-between p-4 bg-zinc-700/30 hover:bg-zinc-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] border border-zinc-600/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-zinc-600 to-zinc-700 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">
                <span>{cat.icon}</span>
              </div>
              <div>
                <span className="text-white font-medium text-base">{cat.category_name}</span>
                <div className="text-zinc-400 text-sm">#{idx + 1} chi tiêu cao nhất</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-red-400 font-bold text-lg">{formatCurrency(Number(cat.total))}</div>
              <div className="text-zinc-500 text-xs">
                {((cat.total / topCategories.reduce((sum, c) => sum + c.total, 0)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-zinc-700/50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-zinc-500">📝</span>
          </div>
          <p className="text-zinc-400 text-lg font-medium">Không có dữ liệu</p>
          <p className="text-zinc-500 text-sm mt-1">Hãy thêm chi tiêu để xem thống kê</p>
        </div>
      )}
    </div>
  )
}
