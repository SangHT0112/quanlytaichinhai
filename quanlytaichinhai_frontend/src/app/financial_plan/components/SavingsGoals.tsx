"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

type PriorityLevel = "high" | "normal" | "low" // Có thể mở rộng thêm nếu cần

interface SavingsGoal {
  id: string | number
  name: string
  current: number
  target: number
  deadline: string | Date
  priority: PriorityLevel
  // Có thể thêm các trường khác như description, category...
}

interface SavingsGoalsProps {
  goals: SavingsGoal[]
}

export default function SavingsGoals({ goals }: SavingsGoalsProps) {
  const format = (n: number) => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(n)

  const calcProgress = (current: number, target: number) => Math.min((current / target) * 100, 100)
  
  const colors = ["bg-emerald-800/40", "bg-indigo-800/40", "bg-rose-800/40", "bg-yellow-800/40"] as const

  const getDeadlineDaysLeft = (deadline: string | Date) => {
    const deadlineTime = typeof deadline === 'string' 
      ? new Date(deadline).getTime() 
      : deadline.getTime()
    return Math.ceil((deadlineTime - Date.now()) / 86400000)
  }

  return (
    <div className="space-y-4">
      {goals.map((goal, i) => {
        const progress = calcProgress(goal.current, goal.target)
        const daysLeft = getDeadlineDaysLeft(goal.deadline)
        const remaining = goal.target - goal.current

        return (
          <div key={goal.id} className={`space-y-2 p-4 rounded-lg ${colors[i % colors.length]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">{goal.name}</h3>
                <Badge 
                  variant={goal.priority === "high" ? "destructive" : "secondary"} 
                  className="text-xs"
                >
                  {goal.priority === "high" ? "Ưu tiên cao" : "Ưu tiên thường"}
                </Badge>
              </div>
              <div className="text-right text-sm text-white">
                {format(goal.current)} / {format(goal.target)}
                <div className="flex items-center gap-1 text-xs text-zinc-200">
                  <Calendar className="w-3 h-3" /> 
                  Còn {daysLeft} ngày
                </div>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-zinc-700 [&>div]:bg-green-400 rounded" 
            />
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