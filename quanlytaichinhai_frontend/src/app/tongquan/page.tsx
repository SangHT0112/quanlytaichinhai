"use client"
import { useEffect, useState } from "react"
import ExpensePieChart from "@/components/charts/ExpensePieChart"
import WeeklyBarChart from "@/components/charts/WeeklyBarChart"
import LoginRequiredModal from "@/components/LoginRequiredModal"

import { formatCurrency } from "@/lib/format"

import { fetchTopCategories, 
  FinancialSummary,
} from "@/api/overviewApi"

import { fetchOverview } from "@/api/overviewApi"
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null)
  const [topCategories, setTopCategories] = useState<any[]>([])
  const [weeklyExpenses, setWeeklyExpenses] = useState<any[]>([])
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    console.log("localStorage user:", localStorage.getItem("user"))
    if (!userStr) {
      setIsLoggedIn(false)
      setIsLoadingData(false) // ✅ THÊM DÒNG NÀY
      return
    }

    const user = JSON.parse(userStr)
    if (!user?.user_id) {
      setIsLoggedIn(false)
      setIsLoadingData(false) // ✅ THÊM DÒNG NÀY
      return
    }

    setIsLoggedIn(true)

    // Gọi cả 2 API
  Promise.all([
    fetchOverview(user.user_id),
    fetchTopCategories(user.user_id),
  ])
    .then(([summary, topCats]) => {
      setSummaryData(summary)
      setTopCategories(topCats)
    })
    .catch((err) => {
      console.error("Lỗi khi lấy dữ liệu:", err)
    })
    .finally(() => {
      setIsLoadingData(false)
    })
    }, [])
   


  if (isLoadingData) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center  px-4 py-0 animate-pulse text-white">
      {/* Khung tổng quan giả (skeleton) */}
      <div className="w-full max-w-4xl space-y-4">
        {/* 3 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="bg-zinc-800 p-4 rounded-xl shadow space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-600 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Biểu đồ giả */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-800 p-4 rounded-xl shadow h-40" />
          <div className="bg-zinc-800 p-4 rounded-xl shadow h-40" />
        </div>

        {/* Biểu đồ thanh */}
        <div className="bg-zinc-800 p-4 rounded-xl shadow h-40" />
      </div>

      {/* Nếu chưa đăng nhập, hiển thị modal */}
      {!isLoggedIn && <LoginRequiredModal />}
    </div>
  )
}

  

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tổng quan tài chính</h1>

        {/* 3 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-sm text-gray-400">Số dư hiện tại</h3>
            <p className="text-2xl font-semibold text-green-400">
               {formatCurrency(summaryData?.balance || 0)} 
            </p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-sm text-gray-400">Thu nhập tháng này</h3>
            <p className="text-2xl font-semibold text-green-400">
              {formatCurrency(Number(summaryData?.income) || 0)}

            </p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-sm text-gray-400">Chi tiêu tháng này</h3>
            <p className="text-2xl font-semibold text-red-400">
           {formatCurrency(Number(summaryData?.expense) || 0)}
            </p>
          </div>
        </div>

        {/* Thống kê danh mục và biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-zinc-800 p-4 rounded-xl shadow">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white">Top danh mục chi tiêu</h3>
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
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-2">Biểu đồ chi tiêu</h3>
            <div className="h-full">
              <ExpensePieChart />
            </div>
          </div>
        </div>

        {/* Chi tiêu theo tuần */}
        <div className="bg-zinc-800 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Chi tiêu trong tuần</h3>
          <div className="h-40">
            <WeeklyBarChart />
          </div>
        </div>
      </main>
    </div>
  )
}
