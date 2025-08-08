"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Layouts/Sidebar";
import { ChatInput } from "@/components/Layouts/ChatInput";
import { ReactNode, useState, useEffect } from "react";
import { UserProvider } from "@/contexts/UserProvider";
import RightSidebar from "@/components/Layouts/SidebarRight";
import { TransactionProvider } from "@/contexts/TransactionContext";
import OnlineStatus from "@/components/OnlineStatus";

export default function RootLayout({ children }: { children: ReactNode }) {
  type UserType = {
    user_id: number;
    username: string;
    role: string
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarRightOpen, setSidebarRightOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);

  // Xử lý khi resize màn hình
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    setIsSidebarOpen(isDesktop);
    setSidebarRightOpen(isDesktop);

    const handleResize = () => {
      const isDesktopResize = window.innerWidth >= 768;
      setIsSidebarOpen(isDesktopResize);
      setSidebarRightOpen(isDesktopResize);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load user từ localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
  }, []);

  // Các trang không cần sidebar + header
  const isPlainLayout =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/admin");

  return (
    <html lang="vi">
      <body
        className={`flex text-slate-800 font-sans min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat`}
        style={{
          backgroundImage: "url('/background.png')",
        }}
      >
        {isPlainLayout ? (
          children
        ) : (
          <UserProvider>
            <TransactionProvider user={user}>
              {/* Bắt sự kiện online/offline qua WebSocket */}
              {user?.user_id && <OnlineStatus userId={user.user_id} />}

              <Sidebar
                user={user}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
              />

              <div
                className={`flex flex-col flex-1 mt-16 transition-all duration-300 ease-in-out w-full ${
                  isSidebarOpen && isSidebarRightOpen
                    ? "md:ml-60 md:mr-75"
                    : isSidebarOpen
                    ? "md:ml-60"
                    : isSidebarRightOpen
                    ? "md:mr-75"
                    : ""
                }`}
              >
                <main className="flex-1 w-full mx-auto px-1 pb-1">
                  {children}
                </main>

                {/* ChatInput desktop */}
                <div className="hidden md:flex w-full justify-center px-4 py-4">
                  <div className="w-full max-w-3xl">
                    <ChatInput
                      isSidebarOpen={isSidebarOpen}
                      isSidebarRightOpen={isSidebarRightOpen}
                      pathname={pathname}
                    />
                  </div>
                </div>
              </div>

              {/* ChatInput mobile */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 z-50">
                <div className="w-full max-w-3xl mx-auto space-y-2">
                  <ChatInput
                    isSidebarOpen={isSidebarOpen}
                    isSidebarRightOpen={isSidebarRightOpen}
                    pathname={pathname}
                  />
                </div>
              </div>

              <RightSidebar
                isSidebarOpen={isSidebarRightOpen}
                setIsSidebarOpen={setSidebarRightOpen}
                title="Lịch sử giao dịch"
              />
            </TransactionProvider>
          </UserProvider>
        )}
      </body>
    </html>
  );
}
