// financial_plan/components/PlanHeader.tsx
import { SavingsPlan } from "../utils/interfaces";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Trash2 } from "lucide-react";

interface PlanHeaderProps {
  selectedPlan: SavingsPlan;
  checkProgress: () => void;
  exportPDF: () => void;
  handleDeletePlan: (planId: string) => void;
}

export default function PlanHeader({ selectedPlan, checkProgress, exportPDF, handleDeletePlan }: PlanHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600/30 rounded-lg flex items-center justify-center">
          <PiggyBank className="w-6 h-6 text-blue-300" />
        </div>
        <div>
          <CardTitle className="text-2xl text-slate-50">{selectedPlan.name}</CardTitle>
          <p className="text-slate-300 mt-1">{selectedPlan.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={checkProgress} className="bg-blue-600 hover:bg-blue-700">
          Kiểm tra tiến độ
        </Button>
        <Button onClick={exportPDF} className="bg-green-600 hover:bg-green-700">
          Export PDF
        </Button>
        <Button
          onClick={() => handleDeletePlan(selectedPlan.id)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa
        </Button>
      </div>
    </div>
  );
}