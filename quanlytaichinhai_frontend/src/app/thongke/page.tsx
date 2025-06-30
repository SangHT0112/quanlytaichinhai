"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchExpensePieChart } from "@/api/overviewApi"
const monthlyData = [
  { month: "T10", income: 15000000, expense: 8500000 },
  { month: "T11", income: 15000000, expense: 7200000 },
  { month: "T12", income: 18000000, expense: 9800000 },
  { month: "T1", income: 15000000, expense: 6500000 },
]

const categoryData = [
  { name: "Ăn uống", value: 2500000, color: "#8884d8" },
  { name: "Di chuyển", value: 1200000, color: "#82ca9d" },
  { name: "Mua sắm", value: 1800000, color: "#ffc658" },
  { name: "Giải trí", value: 800000, color: "#ff7300" },
  { name: "Hóa đơn", value: 1500000, color: "#00ff88" },
  { name: "Y tế", value: 600000, color: "#ff0088" },
]

const dailyData = [
  { day: "1", amount: 150000 },
  { day: "2", amount: 200000 },
  { day: "3", amount: 180000 },
  { day: "4", amount: 220000 },
  { day: "5", amount: 300000 },
  { day: "6", amount: 250000 },
  { day: "7", amount: 180000 },
  { day: "8", amount: 160000 },
  { day: "9", amount: 190000 },
  { day: "10", amount: 210000 },
  { day: "11", amount: 170000 },
  { day: "12", amount: 230000 },
  { day: "13", amount: 280000 },
  { day: "14", amount: 200000 },
  { day: "15", amount: 150000 },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

export default function ThongKe() {
  const [timeRange, setTimeRange] = useState("month")
  const [expensePieChart, setExpensePieChart] =useState<any[]>([])

  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]

  const incomeChange = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
  const expenseChange = ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100
  useEffect(() => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;

  const user = JSON.parse(userStr);
  fetchExpensePieChart(user.user_id)
    .then((res) => {
      const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff88", "#ff0088", "#ffbb28"]
      const formatted = res.map((item: any, index: number) => ({
        ...item,
        value: Number(item.total),
        name: item.category_name,
        color: COLORS[index % COLORS.length],
      }))
      setExpensePieChart(formatted)
    })
    .catch((err) => {
      console.error("Lỗi khi load lịch sử", err)
    })
}, []);


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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thu nhập tháng này</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.income)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.expense)}</div>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Income vs Expense */}
        <Card>
          <CardHeader>
            <CardTitle>Thu nhập vs Chi tiêu theo tháng</CardTitle>
            <CardDescription>So sánh thu chi 4 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="income" fill="#22c55e" name="Thu nhập" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Chi tiêu" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ chi tiêu theo danh mục</CardTitle>
            <CardDescription>Tỷ lệ chi tiêu tháng này</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensePieChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensePieChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng chi tiêu hàng ngày</CardTitle>
          <CardDescription>Chi tiêu 15 ngày gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết theo danh mục</CardTitle>
          <CardDescription>Phân tích chi tiết từng danh mục chi tiêu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((category, index) => {
              const percentage = (category.value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(category.value)}</div>
                    <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
