"use client"

import { Button } from "@/components/ui/button"
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  user: { username: string } | null
}

export default function Header({ isSidebarOpen, toggleSidebar, user }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-zinc-400 hover:text-white text-2xl"
        >
          ☰ 
        </button>
        <h2 className="text-lg font-semibold">AI Finance Manager</h2>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="px-3">
                Xin chào {user.username}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/profile">Sửa thông tin</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
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
          <Button><Link href="/login">Đăng nhập</Link></Button>
        )}
      </div>
    </header>
  )
}