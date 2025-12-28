"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Menu, Bell, User } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export const Header = ({
  isSidebarOpen,
  setIsSidebarOpen,
  user,
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: (value: boolean) => void
  user: { username: string } | null
}) => {
  return (
    <header className="sticky top-0 z-40 h-15 bg-white border-b border-teal-200/50 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-teal-700" />
        </button>
        <h2 className="text-xl font-semibold text-teal-800">Quản lý tài chính AI</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-teal-100 transition-colors relative">
          <Bell className="w-5 h-5 text-teal-700" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full"></span>
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-teal-100 hover:bg-teal-200 transition-colors cursor-pointer">
                <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-teal-800">Xin chào {user.username}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-teal-200">
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
        ) : (
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

export default Header
