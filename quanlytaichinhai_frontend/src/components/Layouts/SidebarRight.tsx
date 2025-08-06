"use client";

import { useEffect, useRef } from "react";
import { History } from "lucide-react";
import { useTransaction } from "@/contexts/TransactionContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc"; // Thêm plugin UTC
import timezone from "dayjs/plugin/timezone"; // Thêm plugin múi giờ
import "dayjs/locale/vi";
import { formatCurrency } from "@/lib/transactionUtils";
import { Button } from "../ui/button";

// Cấu hình dayjs
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");
dayjs.tz.setDefault("Asia/Ho_Chi_Minh"); // Đặt múi giờ mặc định là Việt Nam

// Hàm helper để định dạng thời gian tương đối kèm ngày tháng
const formatRelativeTime = (time: string) => {
  const now = dayjs().tz("Asia/Ho_Chi_Minh"); // Ngày hiện tại ở múi giờ Việt Nam
  const transactionTime = dayjs(time).tz("Asia/Ho_Chi_Minh"); // Thời gian giao dịch ở múi giờ Việt Nam
  const diffInDays = now.startOf("day").diff(transactionTime.startOf("day"), "day"); // So sánh ngày
  const formattedDate = transactionTime.format("DD/MM/YYYY");

  if (diffInDays === 0) {
    return `Hôm nay - ${formattedDate}`;
  } else if (diffInDays === 1) {
    return `Hôm qua - ${formattedDate}`;
  } else if (diffInDays <= 7) {
    return `${transactionTime.fromNow()} - ${formattedDate}`; // Ví dụ: "3 ngày trước - 03/08/2025"
  } else {
    return formattedDate; // Chỉ hiển thị ngày tháng nếu quá 7 ngày
  }
};

export default function RightSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  title = "Lịch sử nhóm giao dịch",
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  title?: string;
}) {
  const { transactionGroups, refreshTransactionGroups, loadMoreTransactionGroups } = useTransaction();
  const transactionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSidebarOpen) {
      refreshTransactionGroups();
    }
  }, [isSidebarOpen, refreshTransactionGroups]);

  // Scroll to top when opening sidebar
  useEffect(() => {
    if (isSidebarOpen && transactionsContainerRef.current) {
      transactionsContainerRef.current.scrollTop = 0;
    }
  }, [isSidebarOpen]);

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 p-4 transition-all duration-300 ease-in-out h-full flex flex-col ${
        isSidebarOpen
          ? "w-75 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl"
          : "w-12 bg-transparent shadow-none"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-4 border-b border-slate-700/50 transition-all duration-300 ${
          isSidebarOpen ? "" : "hidden"
        }`}
      >
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow transition-all duration-200 ease-in-out"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <History className="w-5 h-5" />
        </Button>
        <h2
          className={`text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {title}
        </h2>
      </div>

      {/* Toggle button when closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 right-2 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-md shadow-md transition-all duration-200 ease-in-out z-10"
          aria-label="Open sidebar"
        >
          <History className="w-5 h-5" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Transaction Group List */}
        <div
          ref={transactionsContainerRef}
          className={`flex-1 overflow-y-auto transition-opacity duration-300 scroll-smooth ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="space-y-3 py-2">
            {transactionGroups.length > 0 ? (
              transactionGroups.map((group) => (
                <div
                  key={group.group_id}
                  className="group flex flex-col p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 transition-all duration-200 cursor-pointer border border-slate-700/50"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-medium text-slate-100 truncate flex-1">
                      {group.group_name}
                    </span>
                    <span
                      className={`font-medium text-sm min-w-[80px] text-right ${
                        group.total_amount >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {group.total_amount >= 0 ? "+" : ""}
                      {formatCurrency(Math.abs(group.total_amount))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(group.transaction_date)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {group.transaction_count} giao dịch
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
                <p className="text-slate-400">Không có nhóm giao dịch nào</p>
                <p className="text-slate-500 text-xs mt-1">Hãy thêm nhóm giao dịch mới</p>
              </div>
            )}
          </div>
        </div>

        {/* Load More Button */}
        {transactionGroups.length > 0 && isSidebarOpen && (
          <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm py-3 px-4 border-t border-slate-700/50">
            <button
              onClick={loadMoreTransactionGroups}
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
        className={`absolute bottom-4 left-4 right-4 border-t border-slate-700/50 py-3 px-4 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Tổng: {transactionGroups.length} nhóm giao dịch</span>
          <span className="text-slate-400">v1.0</span>
        </div> */}
      </div>
    </aside>
  );
}