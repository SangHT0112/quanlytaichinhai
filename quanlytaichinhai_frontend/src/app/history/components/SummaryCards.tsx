"use client"

import { formatCurrency } from "@/lib/format"
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
}

export default function SummaryCards({ totalIncome, totalExpense }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
        <div className="flex items-center justify-between text-sm font-medium mb-2">
          <span>Tổng thu nhập</span>
          <TrendingUp className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
      </div>

      <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
        <div className="flex items-center justify-between text-sm font-medium mb-2">
          <span>Tổng chi tiêu</span>
          <TrendingDown className="w-4 h-4 text-red-600" />
        </div>
        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
      </div>

      <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
        <div className="flex items-center justify-between text-sm font-medium mb-2">
          <span>Số dư ròng</span>
          <ArrowUpDown className="w-4 h-4 text-blue-600" />
        </div>
        <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatCurrency(totalIncome - totalExpense)}
        </div>
      </div>
    </div>
  )
}