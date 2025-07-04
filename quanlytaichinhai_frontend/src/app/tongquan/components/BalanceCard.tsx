"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format"
import { TrendIndicator } from "@/components/Layouts/TrendIndicator"
import { fetchOverview } from "@/api/overviewApi"
import { FinancialSummary } from "@/types/financial"
import OverviewSkeleton from "@/components/Skeleton/OverviewSkeleton"
import { useUser } from "@/contexts/UserProvider"
interface BalanceCardProps {
  actualBalance: number
  monthlySurplus: number
  currentIncome: number
  previousIncome: number
  incomeChangePercentage: number
  currentExpense: number
  previousExpense: number
  expenseChangePercentage: number
}

function BalanceCard({
  actualBalance,
  monthlySurplus,
  currentIncome,
  previousIncome,
  incomeChangePercentage,
  currentExpense,
  previousExpense,
  expenseChangePercentage
}: BalanceCardProps) {
  return (
    <div className="grid gap-6">
      {/* Số dư hiện tại */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-900 p-6 rounded-xl text-white">
        <h2 className="text-lg font-light">Số dư hiện tại</h2>
        <p className="text-4xl font-bold my-2">
          {formatCurrency(Number(actualBalance) || 0)}
        </p>
        <div className="flex gap-4">
          <span className="text-sm">Thặng dư tháng: {formatCurrency(monthlySurplus || 0)}</span>
        </div>
      </div>

      {/* Thu nhập / Chi tiêu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thu nhập */}
        <div className="bg-emerald-900 p-4 rounded-lg">
          <div className="flex justify-between">
            <h3 className="text-gray-300">Thu nhập</h3>
            <TrendIndicator value={incomeChangePercentage || 0} />
          </div>
          <p className="text-2xl font-semibold text-emerald-400">
            {formatCurrency(currentIncome || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            So với tháng trước: {formatCurrency(previousIncome || 0)}
          </p>
        </div>

        {/* Chi tiêu */}
        <div className="bg-rose-900 p-4 rounded-lg">
          <div className="flex justify-between">
            <h3 className="text-gray-300">Chi tiêu</h3>
            <TrendIndicator value={expenseChangePercentage || 0} />
          </div>
          <p className="text-2xl font-semibold text-rose-400">
            {formatCurrency(currentExpense || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Tháng trước: {formatCurrency(previousExpense || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Chi tiêu trung bình: {formatCurrency((currentExpense || 0)/30).slice(0, -3)}/ngày
          </p>
        </div>
      </div>
    </div>
  )
}
export default function BalanceCardPage() {
  const user = useUser()
  console.log("User context:", user)

  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.user_id) {
      setIsLoading(false)
      return
    }

    fetchOverview(user.user_id)
      .then((data) => setSummaryData(data))
      .catch((err) => console.error("Lỗi lấy dữ liệu:", err))
      .finally(() => setIsLoading(false))
  }, [user])

  if (isLoading) {
    return <OverviewSkeleton isLoggedIn={!!user} />
  }

  if (!summaryData) {
    return <div className="text-center text-gray-500 p-4">Không có dữ liệu</div>
  }

  return (
    <main className="bg-black text-white p-6">
      <BalanceCard
        actualBalance={summaryData.actual_balance || 0}
        monthlySurplus={summaryData.monthly_surplus || 0}
        currentIncome={summaryData.current_income || 0}
        previousIncome={summaryData.previous_income || 0}
        incomeChangePercentage={summaryData.income_change_percentage || 0}
        currentExpense={summaryData.current_expense || 0}
        previousExpense={summaryData.previous_expense || 0}
        expenseChangePercentage={summaryData.expense_change_percentage || 0}
      />
    </main>
  )
}
