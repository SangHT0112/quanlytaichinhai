// financial_plan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import axiosInstance from "@/config/axios";
import { SavingsPlan } from "./utils/interfaces";
import { format, calculateProgress } from "./utils/financialUtils";
import PlanSelector from "./components/PlanSelector";
import PlanHeader from "./components/PlanHeader";
import PlanProgress from "./components/PlanProgress";
import ForecastChart from "./components/ForecastChart";
import TabNavigation from "./components/TabNavigation";
import OverviewTab from "./components/OverviewTab";
import AnalysisTab from "./components/AnalysisTab";
import MilestonesTab from "./components/MilestonesTab";
import TipsTab from "./components/TipsTab";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MultiSavingsPlan() {
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [scenario, setScenario] = useState<"best" | "worst">("best");
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "milestones" | "tips">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [userStr, setUserStr] = useState<string | null>(null);

  // Load userStr from localStorage only on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      setUserStr(storedUser);
    }
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        if (!userStr) {
          toast.error("Không tìm thấy thông tin user");
          setLoading(false);
          return;
        }
        const user = JSON.parse(userStr);
        const userId = user.user_id;

        // gọi update trước
        //await axiosInstance.get(`/savings-plans/update-on-load?user_id=${userId}`);

        // rồi mới lấy kế hoạch
        const response = await axiosInstance.get(`/savings-plans?user_id=${userId}`);
        const data: SavingsPlan[] = response.data;
        if (data.length > 0) {
          setSavingsPlans(data);
          setSelectedPlanId(data[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy kế hoạch tiết kiệm:", error);
        toast.error("Không thể tải kế hoạch tiết kiệm");
        setLoading(false);
      }
    };

    if (userStr) {
      fetchPlans();
    }
  }, [userStr]);


  const handleDeletePlan = async (planId: string) => {
    if (!confirm(`Bạn có chắc muốn xóa kế hoạch này?`)) return;
    try {
      if (!userStr) {
        toast.error("Không tìm thấy thông tin user");
        return;
      }
      await axiosInstance.delete(`/savings-plans`, {
        data: {
          user_id: JSON.parse(userStr).user_id,
          plan_id: planId,
        },
      });
      setSavingsPlans((prev) => prev.filter((plan) => plan.id !== planId));
      toast.success("Xóa kế hoạch thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa kế hoạch:", error);
      toast.error("Không thể xóa kế hoạch");
    }
  };

  const checkProgress = () => {
    if (!selectedPlan) return;
    const expected = selectedPlan.monthlyContribution * 12 * yearsRemaining;
    if (selectedPlan.currentAmount < expected) {
      toast.error(`Bạn đang chậm ${format(expected - selectedPlan.currentAmount)} so với kế hoạch!`);
    } else {
      toast.success("Bạn đang đi đúng hướng!");
    }
  };

  const exportPDF = () => {
    if (!selectedPlan) return;
    const doc = new jsPDF();
    doc.text(`Kế hoạch: ${selectedPlan.name}`, 10, 10);
    doc.text(`Mục tiêu: ${format(selectedPlan.targetAmount)}`, 10, 20);
    doc.text(`Hiện tại: ${format(selectedPlan.currentAmount)}`, 10, 30);
    doc.save(`${selectedPlan.name}.pdf`);
  };

  const selectedPlan = savingsPlans.find((plan) => plan.id === selectedPlanId) || null;
  const progress = selectedPlan ? calculateProgress(selectedPlan.currentAmount, selectedPlan.targetAmount) : 0;
  const remainingAmount = selectedPlan ? selectedPlan.targetAmount - selectedPlan.currentAmount : 0;
  const yearsRemaining = selectedPlan ? Math.floor(selectedPlan.timeToGoal / 12) : 0;
  const monthsRemaining = selectedPlan ? selectedPlan.timeToGoal % 12 : 0;

  if (loading) {
    return <div className="text-center text-slate-50">Đang tải...</div>;
  }

  if (!savingsPlans.length) {
    return <div className="text-center text-slate-50">Không có kế hoạch tiết kiệm nào.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-50">Lập Kế Hoạch Tiết Kiệm</h1>
          <p className="text-slate-300 text-lg">Quản lý tài chính thông minh với AI</p>
        </div>

        <PlanSelector
          savingsPlans={savingsPlans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
        />

        {selectedPlan && (
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="space-y-6 p-6">
              <PlanHeader
                selectedPlan={selectedPlan}
                checkProgress={checkProgress}
                exportPDF={exportPDF}
                handleDeletePlan={handleDeletePlan}
              />
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => setScenario("best")}
                  className={scenario === "best" ? "bg-blue-600" : "bg-slate-700"}
                >
                  Best Case (7.5%)
                </Button>
                <Button
                  onClick={() => setScenario("worst")}
                  className={scenario === "worst" ? "bg-blue-600" : "bg-slate-700"}
                >
                  Worst Case (3% + lạm phát)
                </Button>
              </div>
              <PlanProgress
                selectedPlan={selectedPlan}
                progress={progress}
                remainingAmount={remainingAmount}
                yearsRemaining={yearsRemaining}
                monthsRemaining={monthsRemaining}
              />
              <ForecastChart selectedPlan={selectedPlan} scenario={scenario} />
            </CardContent>
          </Card>
        )}

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {selectedPlan && activeTab === "overview" && <OverviewTab selectedPlan={selectedPlan} />}
        {selectedPlan && activeTab === "analysis" && <AnalysisTab selectedPlan={selectedPlan} />}
        {selectedPlan && activeTab === "milestones" && <MilestonesTab selectedPlan={selectedPlan} />}
        {selectedPlan && activeTab === "tips" && <TipsTab selectedPlan={selectedPlan} />}
      </div>
    </div>
  );
}