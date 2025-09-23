// financial_plan/components/MilestonesTab.tsx
import { SavingsPlan } from "../utils/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { format, calculateProgress } from "../utils/financialUtils";

interface MilestonesTabProps {
  selectedPlan: SavingsPlan;
}

export default function MilestonesTab({ selectedPlan }: MilestonesTabProps) {
  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-50">
          <CheckCircle2 className="w-5 h-5 text-green-300" />
          Các cột mốc quan trọng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedPlan.aiAnalysis.milestones.map((milestone, index) => {
          const milestoneProgress = calculateProgress(selectedPlan.currentAmount, milestone.amount);
          const isCompleted = selectedPlan.currentAmount >= milestone.amount;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? "bg-green-600" : "bg-slate-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-50" />
                    ) : (
                      <span className="text-slate-50 text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-50">{format(milestone.amount)}</p>
                    <p className="text-sm text-slate-300">{milestone.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-50">{milestone.timeframe}</p>
                  <p className="text-xs text-slate-300">{milestoneProgress.toFixed(1)}%</p>
                </div>
              </div>
              <Progress
                value={milestoneProgress}
                className={`h-2 ${isCompleted ? "bg-green-900/50 [&>div]:bg-green-500" : "bg-slate-700 [&>div]:bg-slate-500"}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}