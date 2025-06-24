// components/ExpenseBreakdown.tsx
"use client"

import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function ExpenseBreakdown({ categories }: { categories: any[] }) {
  const format = (n: number) => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(n)

  const getTrend = (t: string) => {
    if (t === "up") return <TrendingUp className="w-4 h-4 text-red-400" />
    if (t === "down") return <TrendingDown className="w-4 h-4 text-green-400" />
    return null
  }

  return (
    <div className="space-y-4">
      {categories.map((cat, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{cat.name}</span>
            {getTrend(cat.trend)}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-medium">{format(cat.amount)}</div>
              <div className="text-xs text-zinc-400">{cat.percentage}% tổng chi tiêu</div>
            </div>
            <div className="w-20">
              <Progress value={cat.percentage} className="h-2 bg-zinc-700 [&>div]:bg-green-500 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 