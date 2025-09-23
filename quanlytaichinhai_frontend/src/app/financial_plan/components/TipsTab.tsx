// financial_plan/components/TipsTab.tsx
import { SavingsPlan } from "../utils/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface TipsTabProps {
  selectedPlan: SavingsPlan;
}

export default function TipsTab({ selectedPlan }: TipsTabProps) {
  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-50">
          <Lightbulb className="w-5 h-5 text-blue-300" />
          Lời khuyên thực tế
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedPlan.aiAnalysis.tips.map((tip, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-blue-900/20 rounded border-l-4 border-blue-400">
            <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-200 text-sm font-bold">{index + 1}</span>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">{tip}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}