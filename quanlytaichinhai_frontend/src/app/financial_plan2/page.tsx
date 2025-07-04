"use client"

import { useState } from "react"
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Calendar,
  Circle,
  ChevronUp,
  ChevronDown,
  Target,
  Wallet,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const financialData = {
  currentBalance: 15750000,
  monthlyIncome: 12000000,
  monthlyExpenses: 8500000,
  monthlySavings: 3500000,
  savingsGoals: [
    {
      id: 1,
      name: "Du lịch Nhật Bản",
      target: 50000000,
      current: 18500000,
      deadline: "2024-12-31",
      priority: "high",
    },
  ],
  aiPlan: {
    steps: [
      {
        id: 1,
        title: "Phân tích thu nhập",
        description: "Xác định nguồn thu và tổng thu nhập hàng tháng",
        status: "completed",
        details: "Tổng thu nhập 12 triệu đồng/tháng"
      },
      {
        id: 2,
        title: "Xác định mục tiêu tiết kiệm",
        description: "Đặt mục tiêu tiết kiệm rõ ràng",
        status: "completed",
        details: "Tiết kiệm 5 triệu/tháng cho chuyến du lịch"
      },
      {
        id: 3,
        title: "Phân bổ ngân sách",
        description: "Chia thu nhập thành các danh mục chi tiêu",
        status: "active",
        details: "Đề xuất phân bổ ngân sách dưới đây"
      },
      {
        id: 4,
        title: "Theo dõi thực hiện",
        description: "Giám sát chi tiêu hàng tuần",
        status: "pending",
        details: "Bắt đầu từ ngày 01/12/2023"
      },
      {
        id: 5,
        title: "Điều chỉnh kế hoạch",
        description: "Tối ưu dựa trên thực tế chi tiêu",
        status: "pending",
        details: "Tự động điều chỉnh sau 2 tuần"
      }
    ],
    budgetAllocation: [
      { category: "Tiết kiệm", amount: 4000000, percentage: 33.3 },
      { category: "Nhà ở", amount: 2500000, percentage: 20.8 },
      { category: "Ăn uống", amount: 2000000, percentage: 16.7 },
      { category: "Di chuyển", amount: 1000000, percentage: 8.3 },
      { category: "Giải trí", amount: 800000, percentage: 6.7 },
      { category: "Mua sắm", amount: 700000, percentage: 5.8 },
      { category: "Khác", amount: 1000000, percentage: 8.4 }
    ],
    weeklyCheckpoints: [
      {
        week: 1,
        focus: "Theo dõi chi tiêu ăn uống",
        target: "Dưới 500k/tuần",
        action: "Ghi chép mọi khoản chi"
      },
      {
        week: 2,
        focus: "Đánh giá chi phí di chuyển",
        target: "Giảm 10% so với tuần 1",
        action: "Ưu tiên đi chung xe"
      },
      {
        week: 3,
        focus: "Tối ưu hóa đơn",
        target: "Giảm 15% chi phí điện nước",
        action: "Sử dụng thiết bị tiết kiệm"
      },
      {
        week: 4,
        focus: "Tổng kết tháng",
        target: "Đạt 90% kế hoạch",
        action: "Điều chỉnh cho tháng sau"
      }
    ]
  }
}

export default function FinancialPlanPage() {
  const [currentStep, setCurrentStep] = useState(3)
  const [showDetails, setShowDetails] = useState<number | null>(3)

  const format = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(n)

  const toggleDetails = (id: number) => {
    setShowDetails(showDetails === id ? null : id)
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Kế Hoạch Tài Chính Thông Minh</h1>
        </div>
        <p className="text-zinc-400">AI sẽ giúp bạn lập kế hoạch chi tiêu và tiết kiệm tối ưu nhất</p>
      </div>

      {/* Quy trình AI */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Quy Trình Lập Kế Hoạch</span>
          </CardTitle>
          <CardDescription className="text-zinc-400">
            AI sẽ hướng dẫn bạn từng bước để đạt mục tiêu tài chính
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {financialData.aiPlan.steps.map((step) => (
            <div key={step.id} className={`p-4 rounded-lg border ${step.id === currentStep ? "border-blue-500 bg-blue-900/20" : "border-zinc-700 bg-zinc-800"}`}>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleDetails(step.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center 
                    ${step.status === "completed" ? "bg-green-500" : 
                      step.status === "active" ? "bg-blue-500" : "bg-zinc-600"}`}>
                    {step.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-sm">{step.id}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{step.title}</h3>
                    <p className="text-sm text-zinc-400">{step.description}</p>
                  </div>
                </div>
                {showDetails === step.id ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </div>

              {showDetails === step.id && (
                <div className="mt-4 pl-9 space-y-3">
                  <p className="text-sm text-white">{step.details}</p>
                  
                  {step.id === 3 && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">Phân bổ ngân sách đề xuất</h4>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          Tổng thu nhập: {format(financialData.monthlyIncome)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {financialData.aiPlan.budgetAllocation.map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-300">{item.category}</span>
                              <span className="text-white">{format(item.amount)} ({item.percentage}%)</span>
                            </div>
                            <Progress 
                              value={item.percentage} 
                              className={`h-2 ${item.category === "Tiết kiệm" ? "bg-green-900/50 [&>div]:bg-green-500" : "bg-blue-900/50 [&>div]:bg-blue-500"}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-white mb-3">Kế hoạch theo dõi hàng tuần</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {financialData.aiPlan.weeklyCheckpoints.map((week, i) => (
                          <Card key={i} className="bg-zinc-800 border-zinc-700">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2 text-white">
                                <span className="text-blue-400">Tuần {week.week}</span>
                                <ArrowRight className="w-4 h-4 text-zinc-500" />
                                <span>{week.focus}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Mục tiêu:</span>
                                <span className="text-white">{week.target}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Hành động:</span>
                                <span className="text-green-400">{week.action}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.status === "active" && (
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                      Thực hiện bước này
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hành động tiếp theo */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span>Hành Động Tiếp Theo</span>
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Những việc bạn cần làm ngay để bắt đầu kế hoạch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800 flex items-start gap-3">
            <div className="bg-blue-600 p-2 rounded-full">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Thiết lập phân bổ ngân sách</h3>
              <p className="text-sm text-zinc-300 mt-1">
                Dựa trên đề xuất của AI, hãy xác nhận hoặc điều chỉnh phân bổ ngân sách cho phù hợp với nhu cầu của bạn.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white">
                  Điều chỉnh
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Xác nhận kế hoạch
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 flex items-start gap-3">
            <div className="bg-purple-600 p-2 rounded-full">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Lên lịch đánh giá hàng tuần</h3>
              <p className="text-sm text-zinc-300 mt-1">
                Đặt lịch nhắc nhở vào mỗi Chủ Nhật để xem lại chi tiêu trong tuần và điều chỉnh kế hoạch nếu cần.
              </p>
              <Button variant="outline" className="mt-3 bg-zinc-700 border-zinc-600 text-white">
                Thêm vào lịch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mục tiêu tiết kiệm */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-400" />
            <span>Mục Tiêu Tiết Kiệm</span>
          </CardTitle>
          <CardDescription className="text-zinc-400">
            AI đã tính toán lộ trình để đạt được mục tiêu của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {financialData.savingsGoals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100)
            const monthsLeft = Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
            );
            const monthlyNeed = Math.ceil((goal.target - goal.current) / monthsLeft)

            return (
              <div key={goal.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-white">{goal.name}</h3>
                    <p className="text-sm text-zinc-400">Mục tiêu: {format(goal.target)}</p>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Ưu tiên cao
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Tiến trình:</span>
                    <span className="text-white">{format(goal.current)} ({progress.toFixed(1)}%)</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-zinc-700 [&>div]:bg-green-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-800">
                    <p className="text-sm text-zinc-400">Cần tiết kiệm mỗi tháng</p>
                    <p className="text-lg font-bold text-green-400">{format(monthlyNeed)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800">
                    <p className="text-sm text-zinc-400">Thời gian còn lại</p>
                    <p className="text-lg font-bold text-white">{Math.ceil(monthsLeft)} tháng</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-800 flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-300">
                    <span className="font-medium">Gợi ý từ AI:</span> Bạn cần tiết kiệm {format(monthlyNeed)} mỗi tháng 
                    để đạt mục tiêu đúng hạn. Hiện bạn đang tiết kiệm {format(financialData.monthlySavings)}/tháng.
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}