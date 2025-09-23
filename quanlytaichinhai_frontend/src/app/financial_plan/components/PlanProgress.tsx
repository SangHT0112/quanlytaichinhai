// financial_plan/components/PlanProgress.tsx
import { SavingsPlan } from "../utils/interfaces";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Clock, TrendingUp, Target } from "lucide-react";
import { format } from "../utils/financialUtils";

interface PlanProgressProps {
  selectedPlan: SavingsPlan;
  progress: number;
  remainingAmount: number;
  yearsRemaining: number;
  monthsRemaining: number;
}

export default function PlanProgress({
  selectedPlan,
  progress,
  remainingAmount,
  yearsRemaining,
  monthsRemaining,
}: PlanProgressProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-200">Tiến độ hiện tại</span>
          <span className="text-2xl font-bold text-slate-50">{progress.toFixed(1)}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-slate-700 [&>div]:bg-blue-500" />
        <div className="flex justify-between text-sm">
          <span className="text-green-300">{format(selectedPlan.currentAmount)}</span>
          <span className="text-slate-300">{format(selectedPlan.targetAmount)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-300" />
            <span className="text-xs text-slate-300">Còn lại</span>
          </div>
          <p className="text-lg font-bold text-slate-50">{format(remainingAmount)}</p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-300" />
            <span className="text-xs text-slate-300">Thời gian</span>
          </div>
          <p className="text-lg font-bold text-slate-50">
            {yearsRemaining > 0 ? `${yearsRemaining} năm ` : ""}{monthsRemaining} tháng
          </p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-300" />
            <span className="text-xs text-slate-300">Hàng tháng</span>
          </div>
          <p className="text-lg font-bold text-slate-50">{format(selectedPlan.monthlyContribution)}</p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-yellow-300" />
            <span className="text-xs text-slate-300">Điểm AI</span>
          </div>
          <p className="text-lg font-bold text-slate-50">{selectedPlan.aiAnalysis.feasibilityScore}/100</p>
        </div>
      </div>
    </>
  );
}