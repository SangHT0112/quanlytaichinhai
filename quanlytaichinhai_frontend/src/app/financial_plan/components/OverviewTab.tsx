// financial_plan/components/OverviewTab.tsx
import type { SavingsPlan } from "../utils/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "../utils/financialUtils";

interface OverviewTabProps {
  selectedPlan: SavingsPlan;
}

export default function OverviewTab({ selectedPlan }: OverviewTabProps) {
  const labels: Record<string, string> = {
    apartmentPrice: "Giá căn hộ",
    fees: "Phí và thuế",
    furniture: "Nội thất",
    emergencyBuffer: "Dự phòng",
    tripCost: "Chi phí chuyến đi",
    emergencyFund: "Quỹ khẩn cấp",
  };

  // Dữ liệu cho biểu đồ tròn
  const pieData = Object.entries(selectedPlan.breakdown)
    .filter(([, value]) => value && value > 0)
    .map(([key, value]) => ({
      name: labels[key] || key,
      value: value as number,
    }));

  const colors = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
  ];

  // Calculate total for percentages
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  // Calculate cumulative percentages for CSS conic-gradient
  let cumulativePercentage = 0;
  const gradientStops = pieData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const start = cumulativePercentage;
    cumulativePercentage += percentage;
    return {
      ...item,
      percentage,
      start,
      end: cumulativePercentage,
      color: colors[index % colors.length],
    };
  });

  // Create conic-gradient string
  const conicGradient = gradientStops
    .map((stop, index) => {
      if (index === 0) {
        return `${stop.color} 0% ${stop.end}%`;
      }
      return `${stop.color} ${stop.start}% ${stop.end}%`;
    })
    .join(", ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-slate-50">Chi phí chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {pieData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              return (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-slate-200 text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-50 font-semibold block">{format(item.value)}</span>
                    <span className="text-slate-400 text-xs">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Tổng mục: {pieData.length} | Tổng giá trị: {format(total)}
          </div>

          <div className="mt-6 flex justify-center">
            <div className="relative">
              <div
                className="w-48 h-48 rounded-full"
                style={{
                  background: `conic-gradient(${conicGradient})`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600">
                  <div className="text-center">
                    <div className="text-slate-50 font-semibold text-sm">Tổng</div>
                    <div className="text-slate-200 text-xs">{format(total)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-slate-50">Tối ưu hóa hàng tháng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium">Hiện tại</span>
                <span className="text-slate-400 text-sm">Tiết kiệm hàng tháng</span>
              </div>
              <span className="text-slate-50 font-semibold text-lg">
                {format(selectedPlan.aiAnalysis.monthlyBreakdown.currentSavings)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-800/30 rounded-lg border border-blue-600/50">
              <div className="flex flex-col">
                <span className="text-blue-200 font-medium">Tối ưu hóa</span>
                <span className="text-blue-300 text-sm">Sau khi tối ưu chi phí</span>
              </div>
              <span className="text-blue-100 font-semibold text-lg">
                {format(selectedPlan.aiAnalysis.monthlyBreakdown.optimizedSavings)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-green-800/30 rounded-lg border border-green-600/50">
              <div className="flex flex-col">
                <span className="text-green-200 font-medium">Với đầu tư</span>
                <span className="text-green-300 text-sm">Bao gồm lợi nhuận đầu tư</span>
              </div>
              <span className="text-green-100 font-semibold text-lg">
                {format(selectedPlan.aiAnalysis.monthlyBreakdown.withInvestment)}
              </span>
            </div>
          </div>

      
        </CardContent>
      </Card>
    </div>
  );
}