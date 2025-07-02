import { useEffect, useState } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { fetchDailySpendingTrend } from "@/api/statisticalApi"
import { formatCurrency } from "@/lib/format"
import { TooltipProps } from "recharts"
interface SpendingPoint {
  day: string
  amount: number
}
export default function DailySpendingAreaChart({ userId }: { userId: number }) {
  const [data, setData] = useState<SpendingPoint[]>([])
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-black p-2 rounded shadow text-sm border border-gray-200">
        <p className="font-semibold">📅 Ngày: {label}</p>
        <p>💸 Chi tiêu: {formatCurrency(Number(payload[0].value as number))}</p>
      </div>
    )
  }
  return null
}
  useEffect(() => {
    fetchDailySpendingTrend(userId).then(setData).catch(console.error)
  }, [userId])

  const maxValue = Math.max(...data.map((item) => item.amount), 0)

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}  margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                domain={[0, maxValue * 1.1]}
                tickCount={6} // 👈 số lượng mốc muốn hiển thị
              />
           <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

  )
}
