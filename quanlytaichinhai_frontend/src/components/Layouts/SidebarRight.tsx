"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { useTransaction } from "@/contexts/TransactionContext";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/transactionUtils";

export default function RightSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  title = "Lịch sử giao dịch",
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  title?: string;
}) {
  const [sidebarWidth, setSidebarWidth] = useState("16.67%"); // Default to 1/6 of viewport width
  const isResizing = useRef(false);
  const { transactions, refreshTransactions, loadMoreTransactions } = useTransaction();
  const transactionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSidebarOpen) {
      refreshTransactions();
    }
  }, [isSidebarOpen, refreshTransactions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidthPx = window.innerWidth - e.clientX;
      const minWidthPx = 200; // Minimum width in pixels
      const maxWidthPx = window.innerWidth * 0.3; // Max width: 30% of viewport
      if (newWidthPx >= minWidthPx && newWidthPx <= maxWidthPx) {
        const newWidthPercent = (newWidthPx / window.innerWidth) * 100;
        setSidebarWidth(`${newWidthPercent}%`);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Scroll to top when opening sidebar
  useEffect(() => {
    if (isSidebarOpen && transactionsContainerRef.current) {
      transactionsContainerRef.current.scrollTop = 0;
    }
  }, [isSidebarOpen]);

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl transition-all duration-300 ease-in-out h-full flex flex-col`}
      style={{ width: isSidebarOpen ? sidebarWidth : "3rem" }}
    >
      {/* Resize handle on the left side of the sidebar */}
      {isSidebarOpen && (
        <div
          onMouseDown={() => {
            isResizing.current = true;
          }}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-slate-600 active:bg-cyan-400 transition-colors duration-200 z-20"
        />
      )}

      {/* Header */}
      <div
        className={`flex items-center gap-3 pb-4 border-b border-slate-700/50 transition-all duration-300 ${
          isSidebarOpen ? "px-4 pt-4" : "hidden"
        }`}
      >
        <button
          onClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
            if (isSidebarOpen) setSidebarWidth("16.67%"); // Reset to 1/6 when closing
          }}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md shadow transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2
          className={`text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {title}
        </h2>
      </div>

      {/* When sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => {
            setIsSidebarOpen(true);
            setSidebarWidth("16.67%"); // Reset to 1/6 when opening
          }}
          className="absolute top-0 right-0 m-1 p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow-md z-10 transition-all duration-200 ease-in-out"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Transaction List */}
        <div
          ref={transactionsContainerRef}
          className={`flex-1 overflow-y-auto transition-opacity duration-300 scroll-smooth ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="space-y-3 px-4 py-2">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group flex flex-col p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 transition-all duration-200 cursor-pointer border border-slate-700/50"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-medium text-slate-100 truncate flex-1">
                      {transaction.description}
                    </span>
                    <span
                      className={`font-medium text-sm min-w-[80px] text-right ${
                        transaction.type === "income" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">
                      {dayjs(transaction.time).format("HH:mm - DD/MM/YYYY")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg
                  className="w-12 h-12 text-slate-500 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-slate-400">Không có giao dịch nào</p>
                <p className="text-slate-500 text-xs mt-1">Hãy thêm giao dịch mới</p>
              </div>
            )}
          </div>
        </div>

        {/* Load More Button */}
        {transactions.length > 0 && (
          <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm py-3 px-4 border-t border-slate-700/50">
            <button
              onClick={loadMoreTransactions}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Xem thêm</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`border-t border-slate-700/50 py-3 px-4 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Tổng: {transactions.length} giao dịch</span>
          <span className="text-slate-400">v1.0</span>
        </div>
      </div>
    </aside>
  );
}