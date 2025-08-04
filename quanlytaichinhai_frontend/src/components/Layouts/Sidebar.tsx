"use client"

import Link from "next/link"
import {
  Plus,
  BarChart3,
  Calendar,
  TrendingUp,
  PieChart,
  Menu,
  User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const menuItems = [
  { icon: Plus, label: "Thêm giao dịch", href: "/", emoji: "➕" },
  { icon: PieChart, label: "Tổng quan", href: "/tongquan", emoji: "📊" },
  { icon: Calendar, label: "Lập kế hoạch tài chính", href: "/financial_plan", emoji: "📋" },
  { icon: TrendingUp, label: "Lịch sử", href: "/history", emoji: "📜" },
  { icon: BarChart3, label: "Thống kê", href: "/thongke", emoji: "📈" },
]

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  user,
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: (value: boolean) => void
  user: { username: string } | null
}) {
  const handleLinkClick = (href: string) => {
    localStorage.setItem("redirectAfterLogin", href)
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-800 to-slate-900 p-4 shadow-xl transition-all duration-300 ease-in-out h-full ${
        isSidebarOpen ? "w-1/6" : "w-12"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-4 border-b border-slate-700/50 transition-all duration-300 ${
          isSidebarOpen ? "" : "hidden"
        }`}
      >
        <h2
          className={`text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          AI Finance
        </h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow-md transition-all duration-200 ease-in-out"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Toggle button when closed */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-0 left-0 p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow-md transition-all duration-200 ease-in-out z-10 ${
          isSidebarOpen ? "hidden" : ""
        }`}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Menu items */}
      <nav
        className={`space-y-2 text-sm mt-4 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} onClick={() => handleLinkClick(item.href)}>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group cursor-pointer">
              <item.icon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Version + User Greeting */}
      <div
        className={`absolute bottom-15 left-4 right-4 space-y-2 pt-4 border-t border-slate-700/50 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-teal-100 hover:bg-teal-200 transition-colors cursor-pointer">
                <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-teal-800 truncate">
                  Xin chào {user.username}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white border border-teal-200 mb-1" side="top">
              <DropdownMenuItem className="hover:bg-teal-50">
                <Link href="/profile">Sửa thông tin</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-teal-50"
                onClick={() => {
                  localStorage.removeItem("user")
                  localStorage.removeItem("token")
                  window.location.href = "/login"
                }}
              >
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}
