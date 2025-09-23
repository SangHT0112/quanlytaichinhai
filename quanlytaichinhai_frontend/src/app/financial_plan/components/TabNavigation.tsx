// financial_plan/components/TabNavigation.tsx
import { Target, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";

interface TabNavigationProps {
  activeTab: "overview" | "analysis" | "milestones" | "tips";
  setActiveTab: (tab: "overview" | "analysis" | "milestones" | "tips") => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: "overview", label: "Tổng quan", icon: Target },
    { id: "analysis", label: "Phân tích AI", icon: Lightbulb },
    { id: "milestones", label: "Cột mốc", icon: CheckCircle2 },
    { id: "tips", label: "Lời khuyên", icon: AlertCircle },
  ];

  return (
    <div className="flex gap-2 bg-slate-800 p-2 rounded-lg border border-slate-600">
      {tabs.map(({ id, label, icon: Icon }) => (
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
  );
}