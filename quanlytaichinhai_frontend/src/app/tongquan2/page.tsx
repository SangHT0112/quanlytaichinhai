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
  } from "lucide-react"
  import { Progress } from "@/components/ui/progress"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

  // Dữ liệu ảo mô phỏng kế hoạch tài chính AI
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
    expenseCategories: [
      { name: "Ăn uống", amount: 1200000, limit: 2000000, percentage: 33, trend: "up" },
      { name: "Di chuyển", amount: 500000, limit: 1000000, percentage: 18, trend: "down" },
      { name: "Giải trí", amount: 1200000, limit: 1000000, percentage: 14, trend: "up" },
      { name: "Mua sắm", amount: 1000000, limit: 1200000, percentage: 12, trend: "stable" },
      { name: "Hóa đơn", amount: 800000, limit: 800000, percentage: 9, trend: "stable" },
      { name: "Khác", amount: 1200000, limit: 1000000, percentage: 14, trend: "down" },
    ],
    aiRecommendations: [
      {
        type: "warning",
        title: "Chi tiêu ăn uống tăng cao",
        description: "Bạn đang chi vượt hạn mức ăn uống. Hãy điều chỉnh lại thói quen chi tiêu.",
        action: "Giảm 500k",
      },
      {
        type: "success",
        title: "Tiết kiệm đúng kế hoạch",
        description: "Bạn đang tiết kiệm tốt cho chuyến đi Nhật Bản.",
        action: "Tiếp tục duy trì",
      },
      {
        type: "info",
        title: "Cơ hội tăng thu nhập",
        description: "Bạn có thể kiếm thêm 2 triệu từ freelance tháng này.",
        action: "Xem gợi ý",
      },
    ],
    aiSpendingAdvice: [
      { category: "Ăn uống", amount: 2000000 },
      { category: "Tiền trọ", amount: 1000000 },
      { category: "Di chuyển", amount: 800000 },
      { category: "Giải trí", amount: 500000 },
      { category: "Mua sắm", amount: 700000 },
      { category: "Hóa đơn", amount: 1000000 },
      { category: "Khác", amount: 500000 },
    ],
    // Thêm dữ liệu kế hoạch chi tiết
    monthlyPlan: {
      income: 12000000,
      expenses: 8000000,
      savings: 4000000,
      categories: [
        { name: "Ăn uống", planned: 2000000, actual: 0 },
        { name: "Tiền trọ", planned: 1000000, actual: 0 },
        { name: "Di chuyển", planned: 800000, actual: 0 },
        { name: "Giải trí", planned: 500000, actual: 0 },
        { name: "Mua sắm", planned: 700000, actual: 0 },
        { name: "Hóa đơn", planned: 1000000, actual: 0 },
        { name: "Khác", planned: 500000, actual: 0 },
        { name: "Tiết kiệm", planned: 4000000, actual: 0 },
      ]
    },
    
    // Thêm dữ liệu tiến trình
    progressUpdates: [
      {
        date: "2023-11-15",
        message: "Chi tiêu ăn uống đã đạt 70% hạn mức sau 15 ngày",
        adjustment: "Giảm chi tiêu ăn uống 200k cho nửa tháng còn lại"
      },
      {
        date: "2023-11-10",
        message: "Thu nhập thêm 1.5 triệu từ việc làm thêm",
        adjustment: "Tăng tiết kiệm thêm 1 triệu"
      }
    ]

  }

 


  export default function FinancialPlanPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("month")
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
    const [actualSpending, setActualSpending] = useState<Record<string, number>>({
      "Ăn uống": 1200000,
      "Tiền trọ": 1000000,
      "Di chuyển": 500000,
      "Giải trí": 1200000,
      "Mua sắm": 1000000,
      "Hóa đơn": 800000,
      "Khác": 1200000,
      "Tiết kiệm": 3500000
    })

    // Hàm tính phần trăm hoàn thành
    const calculateCompletion = (planned: number, actual: number) => {
      if (planned === 0) return 0
      return Math.min((actual / planned) * 100, 100)
    }

    // Hàm tính chênh lệch
    const calculateDifference = (planned: number, actual: number) => {
      return actual - planned
    }

 

    const format = (n: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(n)

    const getTrendIcon = (trend: string) => {
      if (trend === "up") return <TrendingUp className="w-4 h-4 text-red-400" />
      if (trend === "down") return <TrendingDown className="w-4 h-4 text-green-400" />
      return null
    }

    const getIcon = (type: string) => {
      if (type === "warning") return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      if (type === "success") return <CheckCircle className="w-5 h-5 text-green-400" />
      return <Lightbulb className="w-5 h-5 text-blue-400" />
    }

    return (
      <div className="space-y-6 p-4">
        {/* Tiêu đề + chọn kỳ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Kế Hoạch Tài Chính</h1>
            <p className="text-zinc-400 mt-1">Phân tích và đề xuất từ AI</p>
          </div>
          <div className="flex gap-2">
            {["week", "month", "year"].map((value) => (
              <Button
                key={value}
                variant={selectedPeriod === value ? "default" : "outline"}
                size="sm"
                className="bg-zinc-800 border-zinc-700"
                onClick={() => setSelectedPeriod(value)}
              >
                {value === "week" ? "Tuần" : value === "month" ? "Tháng" : "Năm"}
              </Button>
            ))}
          </div>
        </div>

        {/* Tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Số dư hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{format(financialData.currentBalance)}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Thu nhập tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{format(financialData.monthlyIncome)}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Chi tiêu tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{format(financialData.monthlyExpenses)}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <PiggyBank className="w-4 h-4" /> Tiết kiệm tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{format(financialData.monthlySavings)}</div>
              <p className="text-xs text-green-400 mt-1">
                {((financialData.monthlySavings / financialData.monthlyIncome) * 100).toFixed(1)}% thu nhập
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mục tiêu tiết kiệm */}
        <p className="text-lg font-semibold">Mục tiêu tiết kiệm</p>
        <div className="space-y-4">
          {financialData.savingsGoals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100)
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
            const remaining = goal.target - goal.current

            return (
              <div key={goal.id} className="p-4 rounded-lg bg-emerald-800/40 space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 text-white font-medium">
                    {goal.name}
                    <Badge
                      variant={goal.priority === "high" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {goal.priority === "high" ? "Ưu tiên cao" : "Ưu tiên"}
                    </Badge>
                  </div>
                  <div className="text-sm text-white text-right">
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

        {/* Phân tích chi tiêu */}
        <p className="text-lg font-semibold">Phân tích chi tiêu</p>
        <div className="space-y-4">
          {financialData.expenseCategories.map((cat, i) => {
            const isOver = cat.amount > cat.limit
            const percentUsed = Math.min((cat.amount / cat.limit) * 100, 100)

            return (
              <div key={i} className={`p-4 rounded-lg flex flex-col gap-2 ${isOver ? "bg-red-500/20" : "bg-zinc-800"}`}>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 text-white font-medium">
                    {cat.name} {getTrendIcon(cat.trend)}
                  </div>
                  {isOver && (
                    <div className="flex items-center gap-1 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4" /> Vượt hạn mức!
                    </div>
                  )}
                </div>
                <div className="text-sm text-white">
                  Đã chi: {format(cat.amount)} / {format(cat.limit)}
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
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

        {/* Đề xuất từ AI */}
        <p className="text-lg font-semibold">Đề xuất từ AI</p>
        <div className="space-y-4">
          {financialData.aiRecommendations.map((rec, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg bg-zinc-800">
              {getIcon(rec.type)}
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">{rec.title}</h4>
                <p className="text-sm text-zinc-400 mb-2">{rec.description}</p>
                <Button size="sm" variant="outline" className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
                  {rec.action}
                </Button>
              </div>
            </div>
          ))}
        </div>

      {/* Kế hoạch chi tiêu hàng tháng */}
      <p className="text-lg font-semibold">📅 Kế hoạch chi tiêu tháng này</p>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span>Phân bổ ngân sách</span>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {((financialData.monthlySavings / financialData.monthlyIncome) * 100).toFixed(0)}% tiết kiệm
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {financialData.monthlyPlan.categories.map((category) => {
            const actual = actualSpending[category.name] || 0
            const difference = calculateDifference(category.planned, actual)
            const completion = calculateCompletion(category.planned, actual)
            const isOver = actual > category.planned

            return (
              <div key={category.name} className="space-y-2">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                >
                  <div className="flex items-center gap-3">
                    <Circle className="w-3 h-3 text-blue-400" />
                    <span className="font-medium text-white">{category.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {format(category.planned)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isOver ? 'text-red-400' : 'text-green-400'}`}>
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
                  <div className="ml-6 space-y-3 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Kế hoạch:</span>
                      <span className="text-white">{format(category.planned)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Thực tế:</span>
                      <span className={`${isOver ? 'text-red-400' : 'text-green-400'}`}>
                        {format(actual)} ({difference >= 0 ? '+' : ''}{format(difference)})
                      </span>
                    </div>
                    <Progress 
                      value={completion} 
                      className={`h-2 ${isOver ? 'bg-red-900/50 [&>div]:bg-red-500' : 'bg-green-900/50 [&>div]:bg-green-500'}`} 
                    />
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Hoàn thành: {completion.toFixed(1)}%</span>
                      <span>{isOver ? 'Vượt' : 'Tiết kiệm'} {format(Math.abs(difference))}</span>
                    </div>
                    
                    {isOver && (
                      <div className="mt-2 p-2 bg-red-900/20 rounded text-sm text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>Bạn đã chi vượt {format(Math.abs(difference))} so với kế hoạch</p>
                          <p className="mt-1 text-xs">Đề xuất: Giảm chi tiêu {category.name} trong thời gian tới</p>
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

      {/* Điều chỉnh kế hoạch */}
      <p className="text-lg font-semibold">🔄 Điều chỉnh kế hoạch</p>
      <div className="space-y-3">
        {financialData.progressUpdates.map((update, index) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar className="w-4 h-4" />
                  {update.date}
                </div>
                <Badge variant="outline" className="text-xs">
                  Cập nhật
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-white">{update.message}</p>
                <div className="flex items-start gap-2 p-2 bg-blue-900/20 rounded text-sm text-blue-300">
                  <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Điều chỉnh: {update.adjustment}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-lg font-semibold mt-8">💡 Gợi ý từ AI về chi tiêu cụ thể</p>
      <div className="space-y-2 text-sm text-white">
        {financialData.aiSpendingAdvice.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400 mt-1" />
            <span>
              Bạn nên chi khoảng <strong>{format(item.amount)}</strong> cho <strong>{item.category}</strong> mỗi tháng.
            </span>
          </div>
        ))}
      </div>


      </div>
    )
  }
