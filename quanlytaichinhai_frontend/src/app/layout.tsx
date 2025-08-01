'use client';
import {usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Layouts/Sidebar";
import { ChatInput } from "@/components/Layouts/ChatInput";
import { ReactNode, useState, useEffect } from "react";
import { UserProvider } from "@/contexts/UserProvider"
import RightSidebar from "@/components/Layouts/SidebarRight";
import { TransactionProvider } from "@/contexts/TransactionContext";
export default function RootLayout({ children }: { children: ReactNode }) {

  type UserType = {
  user_id: number;
  username: string;
  }
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarRightOpen, setSidebarRightOpen] = useState(true);
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);

  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
        {/* Sidebar */}
        <Sidebar user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Main content */}
        <UserProvider>
          <TransactionProvider user={user}>
            {/* Tất cả phải nằm trong đây */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out`}>
              <main className="flex-1 w-full max-w-[calc(100%-16rem)] mx-auto px-4">
                {children}
              </main>
              <ChatInput isSidebarOpen={isSidebarOpen} pathname={pathname} />
            </div>

            {/* ✅ Move RightSidebar inside here */}
            <RightSidebar
              isSidebarOpen={isSidebarRightOpen}
              setIsSidebarOpen={setSidebarRightOpen}
              title="Lịch sử giao dịch hôm nay"
            />
          </TransactionProvider>
        </UserProvider>

      </body>
    </html>
  )
}