"use client"
import { useState, useEffect } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { fetchExpensePieChart } from "@/api/overviewApi"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#FF6384"]

type ExpenseItemFromAPI = {
  icon: string
  category_name: string
  total: string
}

type PieChartItem = {
  name: string
  value: number
  color: string
}

// const formatCurrency = (value: number) => {
//   return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
// }

export default function ExpensePieChart() {
  const [categoryData, setCategoryData] = useState<PieChartItem[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) return
    const userId = JSON.parse(userStr).user_id

    fetchExpensePieChart(userId)
      .then((res: ExpenseItemFromAPI[]) => {
        const formatted = res.map((item, index) => ({
          name: item.category_name,
          value: Number(item.total),
          color: COLORS[index % COLORS.length],
        }))
        setCategoryData(formatted)
      })
      .catch((err) => console.error("Lỗi biểu đồ chi tiêu:", err))
  }, [])

  if (!Array.isArray(categoryData) || categoryData.length === 0) {
    return <p>Đang tải dữ liệu biểu đồ...</p>
  }

  return (
    <Card className="bg-zinc-800 text-white">
      <CardHeader>
        <CardTitle>Phân bổ chi tiêu theo danh mục</CardTitle>
        <CardDescription>Tỷ lệ chi tiêu tháng này</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
