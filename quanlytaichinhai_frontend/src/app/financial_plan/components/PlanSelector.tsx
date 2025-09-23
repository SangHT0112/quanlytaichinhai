// financial_plan/components/PlanSelector.tsx
import { SavingsPlan } from "../utils/interfaces";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, calculateProgress } from "../utils/financialUtils";

interface PlanSelectorProps {
  savingsPlans: SavingsPlan[];
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
}

export default function PlanSelector({ savingsPlans, selectedPlanId, setSelectedPlanId }: PlanSelectorProps) {
  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader>
        <CardTitle className="text-slate-50">Danh sách kế hoạch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
          <SelectTrigger className="bg-slate-700 text-slate-50 border-slate-600">
            <SelectValue placeholder="Chọn kế hoạch" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 text-slate-50 border-slate-600">
            {savingsPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id} className="hover:bg-slate-600">
                {plan.name} ({format(plan.targetAmount)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savingsPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg ${selectedPlanId === plan.id ? "bg-blue-800/50" : "bg-slate-700"}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-50">{plan.name}</span>
                <Badge
                  className={
                    plan.priority === "high"
                      ? "bg-red-600"
                      : plan.priority === "low"
                      ? "bg-blue-600"
                      : "bg-yellow-600"
                  }
                >
                  {plan.priority === "high" ? "Cao" : plan.priority === "low" ? "Thấp" : "Trung bình"}
                </Badge>
              </div>
              <Progress
                value={calculateProgress(plan.currentAmount, plan.targetAmount)}
                className="h-2 mt-2 bg-slate-600 [&>div]:bg-blue-500"
              />
              <p className="text-sm text-slate-300 mt-1">
                Đã đạt: {format(plan.currentAmount)} / {format(plan.targetAmount)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}