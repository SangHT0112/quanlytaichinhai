// components/OverviewCards.tsx
"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
interface FinancialData {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  // Có thể thêm các trường khác nếu cần
}
export default function OverviewCards({ data }: { data: FinancialData }) {
  const format = (n: number) => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(n)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Số dư hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{format(data.currentBalance)}</div>
          <p className="text-xs text-green-400 mt-1">+{format(data.monthlySavings)} tháng này</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Thu nhập tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{format(data.monthlyIncome)}</div>
          <p className="text-xs text-zinc-400 mt-1">Ổn định</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Chi tiêu tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{format(data.monthlyExpenses)}</div>
          <p className="text-xs text-yellow-400 mt-1">+5% so với tháng trước</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <PiggyBank className="w-4 h-4" /> Tiết kiệm tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{format(data.monthlySavings)}</div>
          <p className="text-xs text-green-400 mt-1">
            {((data.monthlySavings / data.monthlyIncome) * 100).toFixed(1)}% thu nhập
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 
