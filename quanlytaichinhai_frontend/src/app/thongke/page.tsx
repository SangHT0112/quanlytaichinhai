"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import MonthlyBarChart from "./MonthlyBarChart"
import ExpensePieChart from "./ExpensePieChart"
import DailySpendingAreaChart from "./DailySpendingAreaChart"
import CategoryDetailList from "./CategoryDetailList"
// const monthlyData = [
//   { month: "T10", income: 15000000, expense: 8500000 },
//   { month: "T11", income: 15000000, expense: 7200000 },
//   { month: "T12", income: 18000000, expense: 9800000 },
//   { month: "T1", income: 15000000, expense: 6500000 },
// ]


export default function ThongKe() {
  const [timeRange, setTimeRange] = useState("month")
  // const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null)
  // const currentMonth = monthlyData[monthlyData.length - 1]
  // const previousMonth = monthlyData[monthlyData.length - 2]

  // const incomeChange = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
  // const expenseChange = ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
  const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserId(user.user_id)
    }
  }, [])

  // useEffect(() => {
  //   if (userId === null) return
  //   fetchOverview(userId)
  //     .then((res) => setSummaryData(res))
  //     .catch(console.error)
  // }, [userId])


  return (
    <div className="space-y-6">
     
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Thống kê & Biểu đồ</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">7 ngày qua</SelectItem>
            <SelectItem value="month">Tháng này</SelectItem>
            <SelectItem value="quarter">Quý này</SelectItem>
            <SelectItem value="year">Năm này</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comparison Cards */}
      {/* <div className="grid gap-4 md:grid-cols-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thu nhập tháng này</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData ? formatCurrency(summaryData.income) : "Đang tải..."}</div>
            <p className={`text-xs ${incomeChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {incomeChange >= 0 ? "+" : ""}
              {incomeChange.toFixed(1)}% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi tiêu tháng này</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData ? formatCurrency(summaryData.expense) : "Đang tải..."}</div>
            <p className={`text-xs ${expenseChange <= 0 ? "text-green-600" : "text-red-600"}`}>
              {expenseChange >= 0 ? "+" : ""}
              {expenseChange.toFixed(1)}% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiết kiệm tháng này</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentMonth.income - currentMonth.expense)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100).toFixed(1)}% thu nhập
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi tiêu trung bình/ngày</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.expense / 30)}</div>
            <p className="text-xs text-muted-foreground">Dựa trên 30 ngày</p>
          </CardContent>
        </Card>
      </div> */}

       {userId && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="">
              {/* <CardHeader>
                <CardTitle>Thu nhập vs Chi tiêu theo tháng</CardTitle>
                <CardDescription>So sánh thu chi 4 tháng gần nhất</CardDescription>
              </CardHeader> */}
              <CardContent>
                <MonthlyBarChart />
              </CardContent>
            </Card>

            <Card className="">
              <CardHeader>
                <CardTitle>Phân bổ chi tiêu theo danh mục</CardTitle>
                <CardDescription>Tỷ lệ chi tiêu tháng này</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpensePieChart />
              </CardContent>
            </Card>
          </div>

          <Card className="">
            {/* <CardHeader>
              <CardTitle>Xu hướng chi tiêu hàng ngày</CardTitle>
              <CardDescription>Chi tiêu 15 ngày gần nhất</CardDescription>
            </CardHeader> */}
            <CardContent>
              <DailySpendingAreaChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết theo danh mục</CardTitle>
              <CardDescription>Phân tích chi tiết từng danh mục chi tiêu</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryDetailList />
            </CardContent>
          </Card>
        </>
      )}

    </div>
  )
}
