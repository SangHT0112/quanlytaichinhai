'use client';

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useEffect } from "react";
import { SendHorizonal } from "lucide-react";

import { ReactNode, useState } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [chatInput, setChatInput] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
   const [user, setUser] = useState<{ username: string } | null>(null)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [])
  return (
    <html lang="vi">
      <body className="flex bg-black text-white font-sans min-h-screen">
        {/* Sidebar */}
        {isSidebarOpen && <Sidebar />}

        {/* Main content */}
        <div className="flex flex-col flex-1 min-h-screen relative">
          {/* Header */}
          <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-zinc-400 hover:text-white text-2xl"
            >
              ☰
            </button>
            <div className="flex items-center gap-4">
              {user ? (
                <div>Xin chào {user.username}</div>
              ) : (
                <Button><Link href="/login">Đăng nhập</Link></Button>
              )}
              <h2 className="text-lg font-semibold">AI Finance Manager</h2>
            </div>

          </header>

          {/* Nội dung trang */}
         <main className="flex-1 p-6 pb-40">{children}</main>


          {/* Thanh chat cố định ngoài main, canh giữa phần nội dung */}
          <div
            className={`fixed bottom-4 z-50 transition-all duration-300 ${
              isSidebarOpen ? 'left-64' : 'left-0'
            } right-0`}
          >

        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 space-y-2 shadow-xl">
            <div className="flex items-center gap-2">
              <button className="text-purple-400 text-xl">🤖</button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập yêu cầu tài chính hoặc ví dụ..."
                className="flex-1 px-4 py-2 rounded-full bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none"
              />
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full"
                onClick={() => {
                  if (chatInput.trim()) {
                    // Gọi vào ChatAI qua window
                    (window as any).sendChatMessage?.(chatInput)
                    setChatInput("")
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12l15 6V6l-15 6z" />
                </svg>
              </button>

            </div>

            {/* <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 rounded-full bg-zinc-800 text-sm text-white flex items-center gap-1">
                🟣 Xem số dư
              </button>
              <button className="px-3 py-1 rounded-full bg-zinc-800 text-sm text-white flex items-center gap-1">
                📊 Thống kê
              </button>
              <button className="px-3 py-1 rounded-full bg-zinc-800 text-sm text-white flex items-center gap-1">
                💡 Lời khuyên
              </button>
              <button className="px-3 py-1 rounded-full bg-zinc-800 text-sm text-white flex items-center gap-1">
                📄 Ví dụ giao dịch
              </button>
            </div> */}
          </div>
        </div>
      </div>


        </div>
      </body>
    </html>
  );
}
