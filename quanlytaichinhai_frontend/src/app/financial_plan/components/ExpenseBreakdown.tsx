"use client"

import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
interface Category {
  name: string
  amount: number
  limit?: number
  trend?: "up" | "down" | null
  percentage: number
}





export default function ExpenseBreakdown({ categories }: { categories: Category[] }) {
  const format = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(n)

    const getTrend = (t: "up" | "down" | null | undefined) => {
      if (t === "up") return <TrendingUp className="w-4 h-4 text-red-400" />
      if (t === "down") return <TrendingDown className="w-4 h-4 text-green-400" />
      return null
    }

  return (
    <div className="space-y-4">
      {categories.map((cat, i) => {
        const { name, amount, limit, trend } = cat
        const isOverLimit = limit !== undefined && amount > limit
        const percentUsed = limit ? Math.min((amount / limit) * 100, 100) : cat.percentage
        const difference = limit !== undefined ? limit - amount : null

        return (
          <div
            key={i}
            className={`flex flex-col gap-2 p-4 rounded-lg ${
              isOverLimit ? "bg-red-500/20" : "bg-zinc-800"
            }`}
          >
            {/* Tiêu đề + xu hướng */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{name}</span>
               {getTrend(trend as "up" | "down" | null)}

              </div>
              {isOverLimit && (
                <div className="flex items-center gap-1 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Vượt hạn mức!
                </div>
              )}
            </div>

            {/* Số tiền đã chi + giới hạn + còn lại */}
            <div className="text-sm text-white">
              Đã chi: {format(amount)}{" "}
              {limit !== undefined && (
                <>
                  <span className="text-xs text-zinc-400">/ Giới hạn: {format(limit)}</span>
                  <div className="text-xs mt-1">
                    {difference! >= 0 ? (
                      <span className="text-green-400">Còn lại: {format(difference!)}</span>
                    ) : (
                      <span className="text-red-400">Vượt: {format(Math.abs(difference!))}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Tiến độ chi tiêu */}
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>{percentUsed.toFixed(1)}% hạn mức</span>
              <span>{cat.percentage}% tổng chi tiêu</span>
            </div>

            <Progress
              value={percentUsed}
              className="h-2 bg-zinc-700 [&>div]:bg-green-400 rounded"
            />
          </div>
        )
      })}
    </div>
  )
}
