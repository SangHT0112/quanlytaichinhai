"use client";

import Link from "next/link";
import {
  Plus,
  BarChart3,
  Calendar,
  TrendingUp,
  PieChart,
  Menu,
  User,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react"; // Thêm useEffect
import { getChatHistory } from "@/api/chatHistoryApi";

const menuItems = [
  { icon: Plus, label: "Thêm chi tiêu", href: "/", emoji: "➕" },
  { icon: PieChart, label: "Tổng quan", href: "/tongquan", emoji: "📊" },
  { icon: Calendar, label: "Lập kế hoạch tài chính", href: "/financial_plan", emoji: "📋" },
  { icon: TrendingUp, label: "Lịch sử", href: "/history", emoji: "📜" },
  { icon: BarChart3, label: "Thống kê", href: "/thongke", emoji: "📈" },
  { icon: BarChart3, label: "Chi tiêu", href: "/transaction", emoji: "📈" },
  { icon: Shield, label: "Quản trị", href: "/admin", emoji: "🛡️", adminOnly: true },
];

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  user,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  user: { username: string; role: string } | null;
}) {
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  const [recentChats, setRecentChats] = useState<
    { id: string; title: string; timestamp: string; href: string }[]
  >([]); // State cho recentChats (ban đầu rỗng)

  // Lấy userId từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        return;
      }

      const userId = parsedUser.user_id;

      if (recentChats.length > 0) return;


    // setIsLoading(true); // Bắt đầu loading

    // Fetch TẤT CẢ history (limit 1000 để an toàn, nếu DB lớn thì update backend)
    getChatHistory(userId, 1000) // ✅ FIX: Tăng limit để fetch nhiều hơn
      .then((messages) => {

        // Lọc chỉ user messages
        const userMessages = messages.filter((msg) => msg.role === "user");

        if (userMessages.length === 0) {
          console.log("❌ No user messages → Set empty recentChats");
          setRecentChats([]);
          return;
        }

        // Group theo ngày (YYYY-MM-DD) - TẤT CẢ messages
        const groupedByDate = userMessages.reduce((acc, msg) => {
          const dateKey = msg.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(msg);
          return acc;
        }, {} as Record<string, typeof userMessages>);

        console.log("Grouped by date (all days):", groupedByDate); // Check tất cả groups

        // Lấy TẤT CẢ ngày (sort theo date desc - mới nhất trước)
        // Chỉ lấy 10 ngày gần nhất
        const sortedDates = Object.keys(groupedByDate)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .slice(0, 10);

          // ✅ FIX: Bỏ .slice(0, 5) để hiển thị tất cả
        console.log("Sorted dates (all):", sortedDates); // Check tất cả dates

        // Tạo items cho MỖI NGÀY
        const dailyItems = sortedDates.map((dateKey) => {
          const dayMessages = groupedByDate[dateKey];
          const firstMessage = dayMessages[0]; // Lấy tin nhắn đầu tiên làm title đại diện
          const title = firstMessage.user_input || firstMessage.content || "Chat ngày " + dateKey;
          const truncatedTitle = title.substring(0, 50) + (title.length > 50 ? "..." : "");
          console.log(`Day ${dateKey}: title="${truncatedTitle}" (from: ${firstMessage.user_input || firstMessage.content?.substring(0, 20)})`);
          return {
            id: dateKey,
            title: truncatedTitle,
            timestamp: dateKey,
            href: `/chat?date=${dateKey}`, // Sử dụng date làm param để load chat của ngày đó
          };
        });

        console.log("Final dailyItems (all days):", dailyItems); // Check output
        setRecentChats(dailyItems);
        console.log("=== END DEBUG ===");
      })
      .catch((error) => {
        console.error("❌ Fetch error:", error); // Chi tiết lỗi (network, 4xx/5xx, etc.)
        setRecentChats([]); // Reset nếu lỗi
        console.log("=== END DEBUG (with error) ===");
      });
  }, []); // Chạy một lần khi mount

  const handleLinkClick = (href: string) => {
    localStorage.setItem("redirectAfterLogin", href);
  };

  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

  const handleMouseEnter = () => {
    if (!isSidebarOpen && isDesktop && isManuallyClosed) {
      setIsSidebarOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (isSidebarOpen && isDesktop && isManuallyClosed) {
      setTimeout(() => {
        setIsSidebarOpen(false);
      }, 300); // Đóng sau 300ms
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện chuột lan truyền lên <aside>
    if (isSidebarOpen && isManuallyClosed) {
      // Nếu đang mở do hover, nhấn toggle sẽ mở cố định
      setIsSidebarOpen(true);
      setIsManuallyClosed(false); // Vô hiệu hóa hover
    } else {
      // Nếu không ở trạng thái hover, toggle bình thường
      setIsSidebarOpen(!isSidebarOpen);
      setIsManuallyClosed(isSidebarOpen); // Cập nhật trạng thái đóng thủ công
    }
  };

  return (
    <>
      {/* Nút toggle khi sidebar đóng */}
      <button
        onClick={handleToggle}
        onMouseEnter={(e) => e.stopPropagation()} // Ngăn sự kiện hover của <aside>
        className={`fixed top-4 left-2 z-50 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-md shadow-md transition-all duration-200 ease-in-out z-50 ${
          isSidebarOpen ? "hidden" : "block"
        }`}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 p-4 transition-all duration-300 ease-in-out h-full flex flex-col ${
          isSidebarOpen
            ? "w-75 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl"
            : "w-12 bg-transparent shadow-none"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b border-slate-700/50 transition-all duration-300 ${
            isSidebarOpen ? "" : "hidden"
          }`}
        >
           <button
            onClick={handleToggle}
            className={`p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md shadow-md transition-all duration-200 ease-in-out ${
              isSidebarOpen && !isManuallyClosed ? "border-2 border-green-500" : ""
            }`} // Viền xanh chỉ khi mở cố định
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2
            className={`text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            Quản lý tài chính AI
          </h2>
         
        </div>

       {/* Bọc phần giữa (menu + recent chats) trong flex chia đôi */}
        <div
          className={`flex-1 flex flex-col justify-between transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Phần 1: Menu items */}
          <div className="flex-1 overflow-y-auto pr-2">
            <nav className="space-y-2 text-sm mt-4">
              {menuItems.map((item, index) => {
                if (item.adminOnly && user?.role !== "admin") return null;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => handleLinkClick(item.href)}
                  >
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group cursor-pointer">
                      <item.icon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Divider giữa Menu và Recent Chats */}
          <div className="border-t border-slate-700/50 my-3" />

         
        </div>


        {/* Version + User Greeting + nút Admin nằm trên (giữ nguyên, giờ ở cuối) */}
        <div
          className={`absolute bottom-4 left-4 right-4 flex flex-col space-y-2 pt-4 border-t border-slate-700/50 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {user && (
            <>
              {/* Nút Trang Admin nằm trên */}
        

              {/* Greeting user nằm dưới */}
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-teal-100 hover:bg-teal-200 transition-colors cursor-pointer max-w-full"
                >
                  <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-teal-800 truncate">
                    Xin chào {user.username}
                  </span>
                </button>
              </DropdownMenuTrigger>

<DropdownMenuContent
  align="end"
  className="bg-white border border-teal-200 z-[9999] w-40"
  side="bottom"
  sideOffset={4}
>
                  <DropdownMenuItem className="hover:bg-teal-50">
                    <Link href="/profile">Sửa thông tin</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-teal-50"
                    onClick={() => {
                      localStorage.removeItem("user");
                      localStorage.removeItem("token");
                      window.location.href = "/login";
                    }}
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </aside>
    </>
  );
}