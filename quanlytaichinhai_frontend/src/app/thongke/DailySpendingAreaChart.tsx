"use client"

import { useEffect, useState } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { fetchDailySpendingTrend } from "@/api/statisticalApi"
import { formatCurrency } from "@/lib/format"
import { TooltipProps } from "recharts"
import { useUser } from "@/contexts/UserProvider"
interface SpendingPoint {
  day: string
  amount: number
}

export default function DailySpendingAreaChart() {
  const user = useUser()
  const [data, setData] = useState<SpendingPoint[]>([])
  const [days, setDays] = useState(5)

  useEffect(() => {
    if (!user?.user_id) return;

    fetchDailySpendingTrend(user.user_id, days)
      .then(setData)
      .catch(console.error)
  }, [user, days])


  const maxValue = Math.max(...data.map((item) => item.amount), 0)

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Biểu đồ chi tiêu theo ngày</h3>
          <p className="text-sm text-gray-600">
            So sánh <span className="text-blue-600 font-medium">{days}</span> ngày gần nhất
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="day-select" className="text-sm text-gray-700">Hiển thị:</label>
          <select
            id="day-select"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value={3}>3 ngày</option>
            <option value={5}>5 ngày</option>
            <option value={7}>7 ngày</option>
            <option value={14}>14 ngày</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-10">Không có dữ liệu</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              domain={[0, maxValue * 1.1]}
              tickCount={6}
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
      )}
    </div>
  )
}
