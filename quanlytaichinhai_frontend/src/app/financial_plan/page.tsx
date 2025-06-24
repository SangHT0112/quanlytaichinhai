'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import OverviewCards from "./components/OverviewCards"
import PeriodSelector from "./components/PeriodSelector"
import SavingsGoals from "./components/SavingsGoals"
import ExpenseBreakdown from "./components/ExpenseBreakdown"
import AiRecommendation from "./components/AiRecommendations"
import { financialData } from "@/data/financialData"
export default function FinancialPlanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Kế Hoạch Tài Chính</h1>
          <p className="text-zinc-400 mt-1">Phân tích và đề xuất từ AI</p>
        </div>
        <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
      </div>

      {/* Tổng quan */}
      <OverviewCards data={financialData} />

      <p className="text-lg font-semibold">Mục tiêu tiết kiệm</p>
      <SavingsGoals goals={financialData.savingsGoals} />

      {/* Phân tích chi tiêu */}
      <p className="text-lg font-semibold">Phân tích chi tiêu</p>
      <ExpenseBreakdown categories={financialData.expenseCategories} />

      {/* Đề xuất từ AI */}
      <p className="text-lg font-semibold">Đề xuất từ AI</p>
      <AiRecommendation recommendations={financialData.aiRecommendations} />

      {/* Hành động */}
      <p className="text-lg font-semibold">Hành động tiếp theo</p>
      <div className="flex gap-4 pt-4">
        <Button className="bg-blue-600 hover:bg-blue-500 text-white">Cập Nhật Kế Hoạch</Button>
        <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
          Xuất Báo Cáo
        </Button>
        <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
          Chia Sẻ Với AI
        </Button>
      </div>
    </div>
  )
}
