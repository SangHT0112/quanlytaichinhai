"use client"

import { useState } from "react"
import { Lightbulb, Target, PiggyBank, ChevronDown, ChevronUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Sample financial data for AI-driven monthly plan
const financialData = {
  monthlyPlan: {
    income: 12000000,
    savingsTarget: 4000000,
    categories: [
      { name: "Ăn uống", planned: 2000000, actual: 1200000 },
      { name: "Vui chơi", planned: 500000, actual: 1200000 },
      { name: "Tiền trọ", planned: 1000000, actual: 1000000 },
      { name: "Di chuyển", planned: 800000, actual: 500000 },
      { name: "Mua sắm", planned: 700000, actual: 1000000 },
      { name: "Hóa đơn", planned: 1000000, actual: 800000 },
      { name: "Khác", planned: 500000, actual: 1200000 },
    ],
  },
  aiSpendingAdvice: [
    { category: "Ăn uống", amount: 1800000, reason: "Giảm 200k so với tháng trước để tăng tiết kiệm." },
    { category: "Vui chơi", amount: 400000, reason: "Hạn chế chi tiêu giải trí để ưu tiên mục tiêu tiết kiệm." },
    { category: "Tiền trọ", amount: 1000000, reason: "Giữ nguyên chi phí cố định." },
    { category: "Di chuyển", amount: 700000, reason: "Sử dụng phương tiện công cộng để tiết kiệm." },
    { category: "Mua sắm", amount: 600000, reason: "Hạn chế mua sắm không cần thiết." },
    { category: "Hóa đơn", amount: 900000, reason: "Dự trù tăng nhẹ do hóa đơn điện mùa nóng." },
    { category: "Khác", amount: 400000, reason: "Dự phòng cho chi phí phát sinh." },
  ],
}

export default function MonthlySpendingPlan() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const format = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(n)

  const calculateCompletion = (planned: number, actual: number) => {
    if (planned === 0) return 0
    return Math.min((actual / planned) * 100, 100)
  }

  const totalPlanned = financialData.monthlyPlan.categories.reduce((sum, cat) => sum + cat.planned, 0)
  const totalActual = financialData.monthlyPlan.categories.reduce((sum, cat) => sum + cat.actual, 0)
  const savings = financialData.monthlyPlan.income - totalActual

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Kế Hoạch Chi Tiêu Tháng Này</h1>
        <p className="text-zinc-400 mt-2">Gợi ý từ AI để quản lý tài chính hiệu quả</p>
      </div>

      {/* Overview Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PiggyBank className="w-5 h-5 text-green-400" />
            Tổng quan tài chính
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-zinc-400">Thu nhập</p>
            <p className="text-xl font-bold text-white">{format(financialData.monthlyPlan.income)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Chi tiêu</p>
            <p className="text-xl font-bold text-white">{format(totalActual)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Tiết kiệm</p>
            <p className="text-xl font-bold text-green-400">{format(savings)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Spending Plan */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-blue-400" />
            Phân bổ ngân sách tháng này
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {financialData.monthlyPlan.categories.map((category) => {
            const actual = category.actual
            const planned = category.planned
            const completion = calculateCompletion(planned, actual)
            const isOver = actual > planned
            const advice = financialData.aiSpendingAdvice.find((a) => a.category === category.name)

            return (
              <div key={category.name} className="space-y-2">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{category.name}</span>
                    <span className="text-sm text-zinc-400">({format(planned)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isOver ? "text-red-400" : "text-green-400"}`}>
                      {format(actual)}
                    </span>
                    {expandedCategory === category.name ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {expandedCategory === category.name && (
                  <div className="ml-4 p-3 bg-zinc-800/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Kế hoạch:</span>
                      <span className="text-white">{format(planned)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Thực tế:</span>
                      <span className={isOver ? "text-red-400" : "text-green-400"}>
                        {format(actual)} ({actual >= planned ? "+" : ""}{format(actual - planned)})
                      </span>
                    </div>
                    <Progress
                      value={completion}
                      className={`h-2 ${isOver ? "bg-red-900/50 [&>div]:bg-red-500" : "bg-green-900/50 [&>div]:bg-green-500"}`}
                    />
                    <div className="text-xs text-zinc-400">Hoàn thành: {completion.toFixed(1)}%</div>
                    {advice && (
                      <div className="flex items-start gap-2 text-sm text-blue-300 bg-blue-900/20 p-2 rounded">
                        <Lightbulb className="w-4 h-4 mt-0.5" />
                        <div>
                          <p>Gợi ý AI: Chi {format(advice.amount)} cho {category.name}</p>
                          <p className="text-xs text-blue-200">{advice.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* AI Spending Advice */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Gợi ý chi tiêu từ AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {financialData.aiSpendingAdvice.map((advice, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white">
              <Lightbulb className="w-4 h-4 text-yellow-400 mt-1" />
              <div>
                <p>
                  <strong>{advice.category}</strong>: Chi khoảng {format(advice.amount)}/tháng
                </p>
                <p className="text-zinc-400">{advice.reason}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}