"use client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { fetchWeeklyExpenses } from "@/api/overviewApi"
import { formatCurrency } from "@/lib/format"
import { useUser } from "@/contexts/UserProvider"
export interface WeeklyExpenseData {
  day: string;
  chi: number;
}
export default function WeeklyBarChart() {
  const [data, setData] = useState<WeeklyExpenseData[]>([])
  const user = useUser()
  const userId = user?.user_id
  useEffect(() => {
    if (!userId) return;

    fetchWeeklyExpenses(userId)
      .then((res: WeeklyExpenseData[]) => {
        // Chuẩn hóa tên các ngày trong tuần
        const dayNameMap: Record<string, string> = {
          'Thứ hai': 'Thứ 2',
          'Thứ ba': 'Thứ 3',
          'Thứ tư': 'Thứ 4',
          'Thứ năm': 'Thứ 5',
          'Thứ sáu': 'Thứ 6',
          'Thứ bảy': 'Thứ 7'
        };

        const processedData = res.map(item => ({
          ...item,
          day: dayNameMap[item.day] || item.day // Ánh xạ tên ngày nếu cần
        }));

        // Tạo dữ liệu đầy đủ cho cả tuần
        const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        const fullWeekData = days.map(day => {
          const found = processedData.find(item => item.day === day);
          return found || { day, chi: 0 };
        });

        setData(fullWeekData);
      })
      .catch(console.error);
  }, [userId]);
  return (
    <div className="h-64 w-full min-w-[600px] bg-white rounded-lg p-4 shadow">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(Number(value))}
            tick={{ fontSize: 12 }}
            width={80}
          />
          <Tooltip 
            formatter={(value:number) => formatCurrency(Number(value))}
            contentStyle={{ 
              minWidth: '200px',
              fontSize: '14px'
            }}
          />
          <Bar 
            dataKey="chi" 
            fill="#8884d8" 
            radius={[4, 4, 0, 0]}
            barSize={40} // Tăng kích thước cột
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
