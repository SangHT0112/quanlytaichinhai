"use client"

import Link from "next/link"
import { Plus, BarChart3, Calendar, TrendingUp, PieChart } from "lucide-react"

const menuItems = [
  { icon: Plus, label: "Thêm giao dịch", href: "/", emoji: "➕" },
  { icon: PieChart, label: "Tổng quan", href: "/tongquan", emoji: "📊" },
  { icon: Calendar, label: "Lập kế hoạch tài chính", href: "/financial_plan", emoji: "📋" },
  { icon: TrendingUp, label: "Lịch sử", href: "/history", emoji: "📜" },
  { icon: BarChart3, label: "Thống kê", href: "/thongke", emoji: "📈" },
]

export default function Sidebar() {
  const handleLinkClick = (href: string) => {
    localStorage.setItem("redirectAfterLogin", href)
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 p-4 space-y-6 sticky top-0 h-screen shadow-xl">
      {/* Logo/Brand */}
      <div className="pb-4 border-b border-slate-700/50">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
          AI Finance
        </h2>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 text-sm">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} onClick={() => handleLinkClick(item.href)}>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group cursor-pointer">
              <item.icon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-400 text-center">AI Finance Manager v1.0</div>
      </div>
    </aside>
  )
}
