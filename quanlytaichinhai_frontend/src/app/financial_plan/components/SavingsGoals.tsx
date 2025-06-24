// components/SavingsGoals.tsx
"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

export default function SavingsGoals({ goals }: { goals: any[] }) {
  const format = (n: number) => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(n)

  const calcProgress = (c: number, t: number) => Math.min((c / t) * 100, 100)
  const colors = ["bg-emerald-800/40", "bg-indigo-800/40", "bg-rose-800/40", "bg-yellow-800/40"]

  return (
    <div className="space-y-4">
      {goals.map((goal, i) => {
        const progress = calcProgress(goal.current, goal.target)
        const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
        const remaining = goal.target - goal.current

        return (
          <div key={goal.id} className={`space-y-2 p-4 rounded-lg ${colors[i % colors.length]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">{goal.name}</h3>
                <Badge variant={goal.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                  {goal.priority === "high" ? "Ưu tiên cao" : "Ưu tiên thường"}
                </Badge>
              </div>
              <div className="text-right text-sm text-white">
                {format(goal.current)} / {format(goal.target)}
                <div className="flex items-center gap-1 text-xs text-zinc-200">
                  <Calendar className="w-3 h-3" /> Còn {daysLeft} ngày
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2 bg-zinc-700 [&>div]:bg-green-400 rounded" />
            <div className="flex justify-between text-xs text-zinc-300">
              <span>{progress.toFixed(1)}% hoàn thành</span>
              <span>Còn thiếu {format(remaining)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
} 
