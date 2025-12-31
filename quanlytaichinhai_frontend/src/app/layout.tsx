"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Layouts/Sidebar";
import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { UserProvider } from "@/contexts/UserProvider";
import RightSidebar from "@/components/Layouts/SidebarRight";
import { TransactionProvider } from "@/contexts/TransactionContext";
import OnlineStatus from "@/components/OnlineStatus";
import { ChatInput } from "@/components/Layouts/ChatInput";
import GuideButton from "@/components/Guide/GuideButton";
import { Socket } from "socket.io-client"; // Sửa import: dùng socket.io-client thay vì "net"

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

// Custom hook để dùng socket trong các component con (như ChatAI)
export const useSocket = () => useContext(SocketContext);

export default function RootLayout({ children }: { children: ReactNode }) {
  type UserType = {
    user_id: number;
    username: string;
    role: string;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarRightOpen, setSidebarRightOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [globalSocket, setGlobalSocket] = useState<Socket | null>(null);

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
        className="flex text-slate-800 font-sans min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background.png')",
        }}
      >
        {isPlainLayout ? (
          children
        ) : (
          <UserProvider>
            <TransactionProvider user={user}>
              <SocketContext.Provider value={{ socket: globalSocket }}> {/* Wrap children với SocketContext */}
                {user?.user_id && <OnlineStatus userId={user.user_id} onSocketReady={setGlobalSocket} />}

                <Sidebar
                  user={user}
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                />

               <div
                  className={`flex flex-col flex-1 transition-all duration-300 ease-in-out w-full ${
                    isSidebarOpen && isSidebarRightOpen
                      ? "md:ml-[300px] md:mr-[300px]" // nếu 2 sidebar
                      : isSidebarOpen
                      ? "md:ml-[300px]" // chỉ sidebar trái
                      : isSidebarRightOpen
                      ? "md:mr-[300px]" // chỉ sidebar phải
                      : ""
                  }`}
                >

                  <main className="flex-1 w-full mx-auto">
                    {children}
                  </main>

                  {/* ChatInput cố định, không phụ thuộc vào sidebar */}
                  <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
                    <div className="w-full max-w-3xl mx-auto">
                      <ChatInput
                        isSidebarOpen={isSidebarOpen}
                        isSidebarRightOpen={isSidebarRightOpen}
                        pathname={pathname}
                        centered={true} // Thêm prop centered
                      />
                    </div>
                  </div>
                </div>

                <GuideButton
                  label="Hướng dẫn sử dụng"
                />

                <a
                  href="https://drive.google.com/file/d/12_UR3WlFaeGZ1WTbzg1auKZ_4qwBx9s_/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fixed bottom-5 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition"
                >
                  Xem video hướng dẫn dự án
                </a>


                <RightSidebar
                  isSidebarOpen={isSidebarRightOpen}
                  setIsSidebarOpen={setSidebarRightOpen}
                  title="Lịch sử giao dịch"
                />
              </SocketContext.Provider>
            </TransactionProvider>
          </UserProvider>
        )}
      </body>
    </html>
  );
}