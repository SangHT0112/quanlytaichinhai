"use client";

import { useState, useEffect } from "react";
import { Lightbulb, Target, PiggyBank, TrendingUp, Clock, AlertCircle, CheckCircle2, DollarSign, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import axiosInstance from "@/config/axios";
// Định nghĩa interfaces
interface Recommendation {
  type: string;
  title: string;
  description: string;
  impact: string;
  priority: string;
}

interface Milestone {
  amount: number;
  timeframe: string;
  description: string;
}

interface ForecastData {
  label: string; // Thay đổi từ 'month: number' thành 'label: string' để lưu nhãn tháng/năm
  balance: number;
  target: number;
}

interface MonthlyBreakdown {
  currentSavings: number;
  optimizedSavings: number;
  withInvestment: number;
}

interface AIAnalysis {
  feasibilityScore: number;
  riskLevel: string;
  recommendations: Recommendation[];
  milestones: Milestone[];
  monthlyBreakdown: MonthlyBreakdown;
  challenges: string[];
  tips: string[];
}

interface SavingsPlan {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  timeToGoal: number;
  priority: string;
  category: string;
  breakdown: Record<string, number>;
  aiAnalysis: AIAnalysis;
}

export default function MultiSavingsPlan() {
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [scenario, setScenario] = useState<"best" | "worst">("best");
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "milestones" | "tips">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  // Hàm định dạng tiền tệ
  const format = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(n);

  // Lấy dữ liệu từ API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Lấy user từ localStorage
       
        if (!userStr) {
          toast.error("Không tìm thấy thông tin user");
          setLoading(false);
          return;
        }
        const user = JSON.parse(userStr);
        const userId = user.user_id; // hoặc user.id tùy bạn lưu
        // Gọi API
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

    fetchPlans();
  }, []);
    // Xóa kế hoạch
    const handleDeletePlan = async (planId: string) => {
      if (!confirm(`Bạn có chắc muốn xóa kế hoạch này?`)) return;
      try {
        await axiosInstance.delete(`/savings-plans`, {
          data: {
            user_id: user.user_id,  // cần lấy user_id từ state/localStorage
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

  const calculateProgress = (current: number, target: number) => Math.min((current / target) * 100, 100);

  // Dự báo số dư với lãi suất và lạm phát, bắt đầu từ tháng hiện tại
  const calculateForecast = (plan: SavingsPlan, months: number): ForecastData[] => {
    const rate = scenario === "best" ? 0.075 : 0.03; // Lãi suất hàng năm
    const inflation = scenario === "worst" ? 0.042 : 0; // Lạm phát hàng năm
    const monthlyRate = rate / 12; // Lãi suất hàng tháng
    const monthlyInflation = inflation / 12; // Lạm phát hàng tháng
    const data: ForecastData[] = []; // Khai báo kiểu cho mảng data

    const currentDate = new Date(); // Lấy ngày hiện tại
    const currentMonth = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();

    // Tính toán cho mỗi tháng từ hiện tại (i=0) đến months
    for (let i = 0; i <= months; i++) {
      // Tính tháng và năm tương lai
      const futureMonth = (currentMonth + i) % 12;
      const futureYear = currentYear + Math.floor((currentMonth + i) / 12);
      const label = `Tháng ${futureMonth + 1}/${futureYear}`; // Nhãn: Tháng MM/YYYY

      // Tính giá trị tương lai của số dư
      const futureValue =
        plan.currentAmount * Math.pow(1 + monthlyRate, i) +
        plan.monthlyContribution * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate || 0);

      // Tính mục tiêu điều chỉnh theo lạm phát
      const effectiveTarget = plan.targetAmount * Math.pow(1 + monthlyInflation, i);

      data.push({
        label,
        balance: futureValue,
        target: effectiveTarget,
      });
    }

    return data;
  };

  const generateTicks = (totalMonths: number): number[] => {
    // Kiểm tra totalMonths hợp lệ
    if (!Number.isInteger(totalMonths) || totalMonths <= 0) {
      console.warn("totalMonths không hợp lệ:", totalMonths);
      return [0]; // Mặc định trả về [0] để tránh lỗi
    }

    if (totalMonths <= 12) {
      // Hiển thị mỗi tháng (1 năm)
      return Array.from({ length: totalMonths + 1 }, (_, i) => i);
    } else if (totalMonths <= 36) {
      // Mỗi 3 tháng (1-3 năm)
      return Array.from({ length: Math.floor(totalMonths / 3) + 1 }, (_, i) => i * 3);
    } else if (totalMonths <= 60) {
      // Mỗi 6 tháng (3-5 năm)
      return Array.from({ length: Math.floor(totalMonths / 6) + 1 }, (_, i) => i * 6);
    } else {
      // Mỗi 12 tháng (>5 năm)
      return Array.from({ length: Math.floor(totalMonths / 12) + 1 }, (_, i) => i * 12);
    }
  };

  const selectedPlan = savingsPlans.find((plan) => plan.id === selectedPlanId) || null;
  const progress = selectedPlan ? calculateProgress(selectedPlan.currentAmount, selectedPlan.targetAmount) : 0;
  const remainingAmount = selectedPlan ? selectedPlan.targetAmount - selectedPlan.currentAmount : 0;
  const yearsRemaining = selectedPlan ? Math.floor(selectedPlan.timeToGoal / 12) : 0;
  const monthsRemaining = selectedPlan ? selectedPlan.timeToGoal % 12 : 0;

  // Kiểm tra tiến độ
  const checkProgress = () => {
    if (!selectedPlan) return;
    const expected = selectedPlan.monthlyContribution * 12 * yearsRemaining;
    if (selectedPlan.currentAmount < expected) {
      toast.error(`Bạn đang chậm ${format(expected - selectedPlan.currentAmount)} so với kế hoạch!`);
    } else {
      toast.success("Bạn đang đi đúng hướng!");
    }
  };

  // Export PDF
  const exportPDF = () => {
    if (!selectedPlan) return;
    const doc = new jsPDF();
    doc.text(`Kế hoạch: ${selectedPlan.name}`, 10, 10);
    doc.text(`Mục tiêu: ${format(selectedPlan.targetAmount)}`, 10, 20);
    doc.text(`Hiện tại: ${format(selectedPlan.currentAmount)}`, 10, 30);
    doc.save(`${selectedPlan.name}.pdf`);
  };

  if (loading) {
    return <div className="text-center text-slate-50">Đang tải...</div>;
  }

  if (!savingsPlans.length) {
    return <div className="text-center text-slate-50">Không có kế hoạch tiết kiệm nào.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6  pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-50">Lập Kế Hoạch Tiết Kiệm</h1>
          <p className="text-slate-300 text-lg">Quản lý tài chính thông minh với AI</p>
        </div>

        {/* Plan Selection */}
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
                          ? "bg-blue-600" // Màu cho mức ưu tiên thấp, bạn có thể tùy chỉnh
                          : "bg-yellow-600"
                      }
                    >
                      {plan.priority === "high" 
                        ? "Cao"
                        : plan.priority === "low"
                        ? "Thấp"
                        : "Trung bình"}
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

         {selectedPlan && (
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
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
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <p className="text-lg font-bold text-slate-50">
                    {selectedPlan.aiAnalysis.feasibilityScore}/100
                  </p>
                </div>
              </div>
           <div className="mt-4">
              <h3 className="text-slate-50 font-semibold mb-2">Dự báo số dư</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={calculateForecast(selectedPlan, selectedPlan.timeToGoal)}
                  margin={{ top: 10, right: 20, left: 50, bottom: 60 }}
                >
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    ticks={generateTicks(selectedPlan.timeToGoal)}  // Thêm prop này: chỉ hiển thị ticks tại các index được chỉ định
                    tickFormatter={(value, index) => generateTicks(selectedPlan.timeToGoal).includes(index) ? value : ""}  // Chỉ format nhãn nếu index trong ticks
                    interval={0}  // Giữ để hiển thị tất cả, nhưng ticks sẽ kiểm soát
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
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-800 p-2 rounded-lg border border-slate-600">
          {[
            { id: "overview", label: "Tổng quan", icon: Target },
            { id: "analysis", label: "Phân tích AI", icon: Lightbulb },
            { id: "milestones", label: "Cột mốc", icon: CheckCircle2 },
            { id: "tips", label: "Lời khuyên", icon: AlertCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === id ? "bg-blue-600 text-slate-50" : "text-slate-300 hover:text-slate-50 hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedPlan && activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-50">Chi phí chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(selectedPlan.breakdown).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    apartmentPrice: "Giá căn hộ",
                    fees: "Phí và thuế",
                    furniture: "Nội thất",
                    emergencyBuffer: "Dự phòng",
                    tripCost: "Chi phí chuyến đi",
                    emergencyFund: "Quỹ khẩn cấp",
                  };
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-slate-200">{labels[key]}</span>
                      <span className="text-slate-50 font-medium">{format(value)}</span>
                    </div>
                  );
                })}
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(selectedPlan.breakdown).map(([key, value]) => ({ name: key, value }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                    >
                      {Object.keys(selectedPlan.breakdown).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => format(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-50">Tối ưu hóa hàng tháng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700 rounded border border-slate-600">
                    <span className="text-slate-200">Hiện tại</span>
                    <span className="text-slate-50">{format(selectedPlan.aiAnalysis.monthlyBreakdown.currentSavings)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-800/50 rounded border border-blue-600/50">
                    <span className="text-blue-200">Tối ưu hóa</span>
                    <span className="text-blue-100">{format(selectedPlan.aiAnalysis.monthlyBreakdown.optimizedSavings)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-800/50 rounded border border-green-600/50">
                    <span className="text-green-200">Với đầu tư</span>
                    <span className="text-green-100">{format(selectedPlan.aiAnalysis.monthlyBreakdown.withInvestment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPlan && activeTab === "analysis" && (
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
                        className={rec.priority === "high" ? "border-red-400 text-red-300 bg-red-900/20" : "border-yellow-400 text-yellow-300 bg-yellow-900/20"}
                      >
                        {rec.priority === "high" ? "Cao" : "Trung bình"}
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
        )}

        {selectedPlan && activeTab === "milestones" && (
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
        )}

        {selectedPlan && activeTab === "tips" && (
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
        )}

      </div>
    </div>
  );
}