"use client"

import { useEffect, useRef, useState } from "react"
import { Menu } from "lucide-react"
import { useTransaction } from "@/contexts/TransactionContext"
export default function RightSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  title = "Lịch sử giao dịch",
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: (value: boolean) => void
  title?: string
}) {
  const [sidebarWidth, setSidebarWidth] = useState(256) // w-64 = 256px
  const isResizing = useRef(false)
  const { transactions, refreshTransactions } = useTransaction();
  useEffect(() => {
    if (isSidebarOpen) {
      refreshTransactions(); // <- Bổ sung dòng này
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      isResizing.current = false
    }


    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl transition-all duration-300 ease-in-out h-full`}
      style={{ width: isSidebarOpen ? `${sidebarWidth}px` : "3rem" }}
    >
      {/* Thanh kéo bên trái sidebar */}
      {isSidebarOpen && (
        <div
          onMouseDown={() => {
            isResizing.current = true
          }}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-slate-600"
        />
      )}

      {/* Header */}
      <div
        className={`flex items-center gap-2 pb-4 border-b border-slate-700/50 transition-all duration-300 ${
          isSidebarOpen ? "px-4 pt-4" : "hidden"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow-md transition-all duration-200 ease-in-out"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2
          className={`text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {title}
        </h2>
      </div>

      {/* Khi sidebar đang đóng */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-0 right-0 m-1 p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow-md z-10 transition-all duration-200 ease-in-out"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Transaction List */}
      <div
        className={`space-y-2 text-sm mt-4 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 px-4" : "opacity-0 pointer-events-none"
        }`}
      >
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col p-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{transaction.description}</span>
                <span
                  className={`font-semibold ${
                    transaction.type === "income" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {transaction.type === "expense" ? "-" : "+"}
                  {transaction.amount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1">{transaction.time}</span>
            </div>
          ))
        ) : (
          <div className="text-slate-400 text-center py-4">Không có giao dịch nào hôm nay.</div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`absolute bottom-4 right-4 left-4 pt-4 border-t border-slate-700/50 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-xs text-slate-400 text-center">AI Tools Manager v1.0</div>
      </div>
    </aside>
  )
}
