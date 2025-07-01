'use client';
import { useRouter, usePathname  } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useEffect } from "react";
import { SendHorizonal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ReactNode, useState } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [chatInput, setChatInput] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  
   const [user, setUser] = useState<{ username: string } | null>(null)

    // ==================== THÊM PHẦN NÀY ====================
    useEffect(() => {
      const handleNavigationMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NAVIGATE') {
        const { path, target } = event.data.payload;
        
        if (pathname !== path) {
          // Thêm loading state nếu cần
          document.body.classList.add('waiting-navigation');
          
          // Delay 3 giây trước khi chuyển trang
          setTimeout(() => {
            router.push(path);
            localStorage.setItem('scrollTarget', target);
            
            // Remove loading state khi hoàn thành
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation');
            }, 1000);
          }, 3000); // 👈 Delay 3 giây ở đây
        } else {
          setTimeout(() => {
            scrollToTarget(target);
          }, 300);
        }
      }

      };

      const scrollToTarget = (targetId: string) => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
          });
          element.classList.add('ring-2', 'ring-blue-500', 'transition-all');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500');
          }, 3000);
        }
      };

      // Xử lý khi trang load (kiểm tra có target trong localStorage không)
      const target = localStorage.getItem('scrollTarget');
      if (target) {
        localStorage.removeItem('scrollTarget');
        setTimeout(() => scrollToTarget(target), 500);
      }

      window.addEventListener('message', handleNavigationMessage);

      return () => {
        window.removeEventListener('message', handleNavigationMessage);
      };
    }, [pathname, router]);
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
            <div className="flex items-center gap-4">
              <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                        localStorage.removeItem("user");
                        localStorage.removeItem("token");
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && chatInput.trim()) {
                    e.preventDefault(); // Ngăn hành vi mặc định
                    localStorage.setItem("pendingChatMessage", chatInput);
                    (window as any).sendChatMessage?.(chatInput);
                    setChatInput("");
                    
                    if (pathname !== "/") {
                      router.replace("/");
                    }
                  }
                }}

                placeholder="Nhập yêu cầu tài chính hoặc ví dụ..."
                className="flex-1 px-4 py-2 rounded-full bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none"
              />
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full"
                onClick={() => {
                  if (chatInput.trim()) {
                    setIsNavigating(true); // ⏳ Bật hiệu ứng
                    
                    localStorage.setItem("pendingChatMessage", chatInput);
                    (window as any).sendChatMessage?.(chatInput);
                    setChatInput("");

                    setTimeout(() => {
                      router.replace("/"); // 🔄 Điều hướng về trang chính
                      setIsNavigating(false); // ✅ Tắt hiệu ứng (nếu ở lại trang cũ vì lỗi)
                    }, 700); // ⏱ 0.7 giây
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

