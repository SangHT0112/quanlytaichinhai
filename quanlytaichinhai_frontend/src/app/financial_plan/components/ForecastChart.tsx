// financial_plan/components/ForecastChart.tsx
import { SavingsPlan } from "../utils/interfaces";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { calculateForecast, generateTicks, format } from "../utils/financialUtils";

interface ForecastChartProps {
  selectedPlan: SavingsPlan;
  scenario: "best" | "worst";
}

export default function ForecastChart({ selectedPlan, scenario }: ForecastChartProps) {
  const forecastData = calculateForecast(selectedPlan, selectedPlan.timeToGoal, scenario);
  
  // Debug: Kiểm tra dữ liệu
  console.log("timeToGoal:", selectedPlan.timeToGoal);
  console.log("forecastData:", forecastData);
  console.log("ticks:", generateTicks(selectedPlan.timeToGoal, forecastData));

  return (
    <div className="mt-4">
      <h3 className="text-slate-50 font-semibold mb-2">Dự báo số dư</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={forecastData}
          margin={{ top: 10, right: 20, left: 50, bottom: 60 }}
        >
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            ticks={generateTicks(selectedPlan.timeToGoal, forecastData)} // Sử dụng nhãn thay vì index
            tickFormatter={(value) => value} // Hiển thị trực tiếp nhãn
            angle={-45}
            textAnchor="end"
            label={{ value: "Thời gian", position: "insideBottom", offset: -15, fill: "#94a3b8" }}
          />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => format(value)} />
          <Tooltip formatter={(value) => format(value as number)} />
          <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Số dư" />
          <Line type="monotone" dataKey="target" stroke="#ef4444" name="Mục tiêu" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}