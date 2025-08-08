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
      return window.innerWidth >= 768;
    }
    return false;
  });

  const [isSidebarRightOpen, setSidebarRightOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });

  // const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false); // State for music player dropdown

  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsSidebarOpen(isDesktop);
      setSidebarRightOpen(isDesktop);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load user from localStorage
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

  // Không áp dụng RootLayout cho trang login
  if (pathname === "/login") {
    return <>{children}</>;
  }
  // Không áp dụng RootLayout cho trang login
  if (pathname === "/register") {
    return <>{children}</>;
  }

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

            {/* Music Player Button and Dropdown
            <div className="relative">
              <button
                onClick={() => setIsMusicPlayerOpen(!isMusicPlayerOpen)}
                className="fixed top-2 left-80 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600"
              >
                {isMusicPlayerOpen ? "Ẩn Nhạc" : "Nghe Nhạc"}
              </button>
              <MusicPlayerPopup
                isOpen={isMusicPlayerOpen}
                onToggle={() => setIsMusicPlayerOpen(false)}
              />
            </div> */}

            {/* Nội dung chính */}
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
              {/* ChatInput trên desktop */}
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

            {/* ChatInput trên mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 z-50">
              <div className="w-full max-w-3xl mx-auto space-y-2">
                <ChatInput
                  isSidebarOpen={isSidebarOpen}
                  isSidebarRightOpen={isSidebarRightOpen}
                  pathname={pathname}
                />
              </div>
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