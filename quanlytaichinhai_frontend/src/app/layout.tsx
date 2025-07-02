"use client"

import { useRouter, usePathname } from "next/navigation"
import "./globals.css"
import Sidebar from "@/components/Layouts/Sidebar"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { useEffect, useState } from "react"
import Header from "@/components/Layouts/Header"
import ChatInput from "@/components/Layouts/ChatInput"
import { useNavigationHandler } from "@/components/hooks/useNavigationHandler"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [user, setUser] = useState<{ username: string } | null>(null)
  
  useNavigationHandler()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])
  
  return (
    <html lang="vi">
      <body className="flex bg-black text-white font-sans min-h-screen">
        {/* Sidebar */}
        {isSidebarOpen && <Sidebar />}

        {/* Main content */}
        <div className="flex flex-col flex-1 min-h-screen relative">
          <Header 
            isSidebarOpen={isSidebarOpen} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            user={user} 
          />

          {/* Nội dung trang */}
          <main className="flex-1 p-6 pb-40">{children}</main>

          {/* Chat input */}
          <ChatInput isSidebarOpen={isSidebarOpen} />
        </div>
      </body>
    </html>
  )
}