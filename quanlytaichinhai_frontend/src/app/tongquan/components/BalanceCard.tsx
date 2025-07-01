"use client"
import { formatCurrency } from "@/lib/format"
import { TrendIndicator } from "@/components/TrendIndicator"

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

export default function BalanceCard({
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
      {/* --- Hàng 1: Số dư nổi bật --- */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-900 p-6 rounded-xl text-white">
        <h2 className="text-lg font-light">Số dư hiện tại</h2>
        <p className="text-4xl font-bold my-2">
          {formatCurrency(Number(actualBalance) || 0)}
        </p>
        <div className="flex gap-4">
          <span className="text-sm">Thặng dư tháng: {formatCurrency(monthlySurplus || 0)}</span>
        </div>
      </div>

      {/* --- Hàng 2: Thu nhập/Chi tiêu --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ô thu nhập */}
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

        {/* Ô chi tiêu */}
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
            Chi tiêu trung bình: {formatCurrency((currentExpense || 0)/30).slice(0,-3)}/ngày
          </p>
        </div>
      </div>
    </div>
  )
}