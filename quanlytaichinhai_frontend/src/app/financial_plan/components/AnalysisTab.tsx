// financial_plan/components/AnalysisTab.tsx
import { SavingsPlan } from "../utils/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertCircle } from "lucide-react";

interface AnalysisTabProps {
  selectedPlan: SavingsPlan;
}

export default function AnalysisTab({ selectedPlan }: AnalysisTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-50">
            <Lightbulb className="w-5 h-5 text-yellow-300" />
            Gợi ý tối ưu từ AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedPlan.aiAnalysis.recommendations.map((rec, index) => (
            <div key={index} className="p-4 bg-slate-700 rounded-lg space-y-2 border border-slate-600">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-50">{rec.title}</h4>
                <Badge
                  variant="outline"
                  className={
                    rec.priority === "high"
                      ? "border-red-400 text-red-300 bg-red-900/20"
                      : rec.priority === "low"
                      ? "border-blue-400 text-blue-300 bg-blue-900/20"
                      : "border-yellow-400 text-yellow-300 bg-yellow-900/20"
                  }
                >
                  {rec.priority === "high" ? "Cao" : rec.priority === "low" ? "Thấp" : "Trung bình"}
                </Badge>
              </div>
              <p className="text-slate-200 text-sm">{rec.description}</p>
              <p className="text-blue-200 text-sm font-medium">Tác động: {rec.impact}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-50">
            <AlertCircle className="w-5 h-5 text-red-300" />
            Thách thức cần lưu ý
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedPlan.aiAnalysis.challenges.map((challenge, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-red-900/20 rounded border-l-4 border-red-400">
              <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
              <p className="text-red-100 text-sm">{challenge}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}