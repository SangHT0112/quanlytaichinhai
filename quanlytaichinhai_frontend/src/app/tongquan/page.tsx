"use client"
import { useEffect, useState } from "react"
import ExpensePieChart from "@/components/charts/ExpensePieChart"
import WeeklyBarChart from "@/components/charts/WeeklyBarChart"
import LoginRequiredModal from "@/components/LoginRequiredModal"
import { AIForecastMock } from "@/components/AI/AIForecastMock"
import { formatCurrency } from "@/lib/format"
import { TrendIndicator } from "@/components/TrendIndicator"
import BalanceCard from "./components/BalanceCard"
import { fetchTopCategories,
} from "@/api/overviewApi"
import OverviewSkeleton from "@/components/Skeleton/OverviewSkeleton"
import { FinancialSummary } from "@/types/financial"
import { fetchOverview } from "@/api/overviewApi"
import TopExpenseCategories from "./components/TopExpenseCategories"
import TransactionList from "./components/TransactionList"
export default function Home() {

  const [user, setUser] = useState<{ user_id: number } | null>(null)

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
    setUser(user) 
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
      return <OverviewSkeleton isLoggedIn={isLoggedIn} />
    }

  

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tổng quan tài chính</h1>
        
        {/* Sử dụng BalanceCard */}
        <BalanceCard 
          actualBalance={summaryData?.actual_balance || 0}
          monthlySurplus={summaryData?.monthly_surplus || 0}
          currentIncome={summaryData?.current_income || 0}
          previousIncome={summaryData?.previous_income || 0}
          incomeChangePercentage={summaryData?.income_change_percentage || 0}
          currentExpense={summaryData?.current_expense || 0}
          previousExpense={summaryData?.previous_expense || 0}
          expenseChangePercentage={summaryData?.expense_change_percentage || 0}
        />

        {/* Thống kê danh mục và biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {user?.user_id && (
            <TopExpenseCategories userId={user.user_id} />
          )}

          {user?.user_id && (
              <TransactionList userId={user.user_id}/>
            )}
        </div>

        {/* Chi tiêu theo tuần */}
        <div className="bg-zinc-800 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Chi tiêu trong tuần</h3>
          <div className="h-40">
            <WeeklyBarChart />
          </div>
        </div>

        {/* // Thêm vào phần JSX (sau phần WeeklyBarChart) */}
        <div className="space-y-6">
          <AIForecastMock />
        </div>
      </main>
    </div>
  )
}
