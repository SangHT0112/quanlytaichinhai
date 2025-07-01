// components/AI/AIForecastMock.tsx
import { useEffect, useState } from "react";
import { MockAI } from "@/data/mockAI";
import { SparklesIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function AIForecastMock() {
  const [forecastData, setForecastData] = useState<
    { date: string; amount: number }[]
  >([]);

  useEffect(() => {
    // Tạo dữ liệu mock với 7 ngày
    const mockData = Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(Date.now() + i * 86400000).toLocaleDateString("vi-VN"),
      amount: Math.floor(Math.random() * 2000000) + 500000, // Random từ 500k đến 2.5 triệu
    }));
    setForecastData(mockData);
  }, []);

  // Tính max amount để scale biểu đồ
  const maxAmount = Math.max(...forecastData.map((item) => item.amount), 1);

  return (
    <div className="bg-zinc-800 p-4 rounded-xl">
      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <SparklesIcon className="w-5 h-5 text-yellow-400" />
        Dự đoán chi tiêu 7 ngày tới (Mock AI)
      </h3>

      {/* Biểu đồ cột */}
      <div className="h-48 flex items-end gap-2">
        {forecastData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            {/* Cột biểu đồ */}
            <div
              className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-sm relative group"
              style={{
                height: `${Math.min(100, (item.amount / maxAmount) * 100)}%`,
              }}
            >
              {/* Tooltip hiện khi hover */}
              <div className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black px-2 py-1 rounded text-xs whitespace-nowrap">
                {formatCurrency(item.amount)}
              </div>
            </div>
            {/* Label ngày */}
            <span className="text-xs mt-1 text-gray-400">
              {item.date.split("/")[0]} {/* Chỉ hiển thị ngày */}
            </span>
          </div>
        ))}
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-zinc-700/50 p-2 rounded">
          <p className="text-gray-400 text-sm">Tổng tuần</p>
          <p className="font-bold">
            {formatCurrency(
              forecastData.reduce((sum, item) => sum + item.amount, 0)
            )}
          </p>
        </div>
        <div className="bg-zinc-700/50 p-2 rounded">
          <p className="text-gray-400 text-sm">Trung bình/ngày</p>
          <p className="font-bold">
            {formatCurrency(
              Math.round(
                forecastData.reduce((sum, item) => sum + item.amount, 0) /
                  Math.max(forecastData.length, 1)
              )
            )}
          </p>
        </div>
      </div>
    </div>
  );
}