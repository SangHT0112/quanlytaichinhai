"use client"
import { useEffect, useState } from "react"
import WeeklyBarChart from "@/app/tongquan/components/WeeklyBarChart"
import LoginRequiredModal from "@/components/Layouts/LoginRequiredModal"
import BalanceCardPage from "./components/BalanceCard"
import { fetchTopCategories } from "@/api/overviewApi"
import OverviewSkeleton from "@/components/Skeleton/OverviewSkeleton"
import { fetchOverview } from "@/api/overviewApi"
import TopExpenseCategories from "./components/TopExpenseCategories"
import TransactionList from "./components/TransactionList"

export default function Home() {
  const [user, setUser] = useState<{ user_id: number } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [topCategories, setTopCategories] = useState<any[]>([])
  const [weeklyExpenses, setWeeklyExpenses] = useState<any[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      setIsLoggedIn(false)
      setIsLoadingData(false)
      return
    }

    const user = JSON.parse(userStr)
    if (!user?.user_id) {
      setIsLoggedIn(false)
      setIsLoadingData(false)
      return
    }

    setUser(user)
    setIsLoggedIn(true)

    // Chỉ gọi API lấy topCategories (không gọi fetchOverview nữa)
    fetchTopCategories(user.user_id)
      .then((topCats) => {
        setTopCategories(topCats)
      })
      .catch((err) => {
        console.error("Lỗi khi lấy danh mục:", err)
      })
      .finally(() => {
        setIsLoadingData(false)
      })
  }, [])

  if (isLoadingData) {
    return <OverviewSkeleton isLoggedIn={isLoggedIn} />
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tổng quan tài chính</h1>

        {/* BalanceCard tự fetch dữ liệu bên trong */}
        <BalanceCardPage />

        {/* Thống kê danh mục và bảng giao dịch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.user_id && <TopExpenseCategories/>}
          {user?.user_id && <TransactionList/>}
        </div>

        {/* Biểu đồ tuần */}
        <div className="bg-zinc-800 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Chi tiêu trong tuần</h3>
          <div className="h-40">
            <WeeklyBarChart />
          </div>
        </div>

        {/* Dự đoán AI */}
        <div className="space-y-6">
        </div>
      </main>
    </div>
  )
}
