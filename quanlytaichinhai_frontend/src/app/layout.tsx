"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Layouts/Sidebar";
import { ChatInput } from "@/components/Layouts/ChatInput";
import { ReactNode, useState, useEffect } from "react";
import { UserProvider } from "@/contexts/UserProvider";
import RightSidebar from "@/components/Layouts/SidebarRight";
import { TransactionProvider } from "@/contexts/TransactionContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  type UserType = {
    user_id: number;
    username: string;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // Mặc định mở trên desktop
    }
    return false; // Mặc định đóng trên di động
  });

  const [isSidebarRightOpen, setSidebarRightOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // Mặc định mở trên desktop
    }
    return false; // Mặc định đóng trên di động
  });

  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);

  // Cập nhật trạng thái sidebar khi resize
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsSidebarOpen(isDesktop);
      setSidebarRightOpen(isDesktop);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lấy thông tin user từ localStorage
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

  return (
    <html lang="vi">
      <body
        className={`flex text-slate-800 font-sans min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat`}
        style={{
          backgroundImage: "url('/background.png')",
        }}
      >
        <UserProvider>
          <TransactionProvider user={user}>
            {/* Sidebar trái */}
            <Sidebar
              user={user}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />

            {/* Nội dung chính */}
            <div
              className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
                isSidebarOpen && isSidebarRightOpen
                  ? "md:ml-60 md:mr-60"
                  : isSidebarOpen
                  ? "md:ml-60"
                  : isSidebarRightOpen
                  ? "md:mr-60"
                  : ""
              }`}
            >
              <main className="flex-1 w-full mx-auto px-4">{children}</main>
              <ChatInput isSidebarOpen={isSidebarOpen} pathname={pathname} />
            </div>

            {/* Sidebar phải */}
            <RightSidebar
              isSidebarOpen={isSidebarRightOpen}
              setIsSidebarOpen={setSidebarRightOpen}
              title="Lịch sử giao dịch"
            />
          </TransactionProvider>
        </UserProvider>
      </body>
    </html>
  );
}