'use client';
import { useRouter, usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Layouts/Sidebar";
import { Header } from "@/components/Layouts/Header";
import { ChatInput } from "@/components/Layouts/ChatInput";
import { ReactNode, useState, useEffect } from "react";
import { UserProvider } from "@/contexts/UserProvider"
export default function RootLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    // Hàm xử lý message từ bên ngoài (ví dụ từ iframe hoặc window.postMessage)
    const handleNavigationMessage = (event: MessageEvent) => {
      // Kiểm tra nếu message có type là 'NAVIGATE'
      if (event.data?.type === 'NAVIGATE') {
        const { path, target } = event.data.payload;
        
        // Nếu path hiện tại khác path cần chuyển đến
        if (pathname !== path) {
          // Thêm class để hiển thị trạng thái loading
          document.body.classList.add('waiting-navigation');
          
          // Delay 3s trước khi chuyển trang (có thể để làm animation)
          setTimeout(() => {
            router.push(path);
            // Lưu target (ID phần tử cần scroll đến) vào localStorage
            localStorage.setItem('scrollTarget', target);
            
            // Sau 1s, xóa class loading
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation');
            }, 1000);
          }, 3000);
        } else {
          // Nếu đang ở trang đích, chỉ cần scroll đến phần tử
          setTimeout(() => {
            scrollToTarget(target);
          }, 300);
        }
      }

      // Kiểm tra nếu message có type là "FILTER"
      if (event.data?.type === 'FILTER') {
        const { message } = event.data.payload;
        
        // Thêm hiệu ứng loading
        document.body.classList.add('waiting-navigation');
        
        if (pathname !== '/history') {
          localStorage.setItem('pendingFilter', message);
          
          setTimeout(() => {
            router.push('/history');
            
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation');
            }, 1000);
          }, 5000); // Giảm thời gian chờ so với NAVIGATE
        } else {
          setTimeout(() => {
            window.postMessage({
              type: 'APPLY_FILTER',
              payload: { message }
            }, '*');
            
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation');
            }, 2000);
          }, 3000); // Thời gian chờ ngắn hơn khi đã ở trang history
        }
      }
      //Kiểm tra nếu Message có type là 'SEARCH'
      // Trong layout chính
      if (event.data?.type === 'SEARCH') {
        const { keyword } = event.data.payload;
        
        // Thêm hiệu ứng loading
        document.body.classList.add('waiting-navigation');
        
        // Lưu từ khóa vào localStorage với key chính xác
        localStorage.setItem('pendingSearch', keyword);
        
        // Nếu không ở trang history thì chuyển trang
        if (pathname !== '/history') {
          setTimeout(() => {
            router.push('/history');
            
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation');
            }, 1000);
          }, 5000); // Giảm thời gian chờ xuống 1s cho mượt
        } 
        // Nếu đang ở trang history thì gửi message APPLY_SEARCH ngay
        else {
          setTimeout(() => {
            window.postMessage({
              type: 'APPLY_SEARCH',
              payload: { keyword }
            }, '*');
            
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation');
            }, 2000);
          }, 3000);
        }
      }
    };


    // Hàm scroll đến phần tử với hiệu ứng highlight
    const scrollToTarget = (targetId: string) => {
      const element = document.getElementById(targetId);
      if (element) {
        // Scroll mượt đến phần tử
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start' 
        });
        // Thêm hiệu ứng highlight (vòng màu xanh)
        element.classList.add('ring-2', 'ring-blue-500', 'transition-all');
        // Sau 3s, xóa hiệu ứng
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500');
        }, 3000);
      }
    };

    // Kiểm tra nếu có target được lưu trong localStorage (sau khi chuyển trang)
    const target = localStorage.getItem('scrollTarget');
    if (target) {
      localStorage.removeItem('scrollTarget'); // Xóa target sau khi dùng
      setTimeout(() => scrollToTarget(target), 500); // Scroll sau 0.5s
    }

    // Lắng nghe sự kiện message từ window
    window.addEventListener('message', handleNavigationMessage);

    // Cleanup: Gỡ bỏ event listener khi component unmount
    return () => {
      window.removeEventListener('message', handleNavigationMessage);
    };
  }, [pathname, router]); // Dependency: pathname và router

  
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
          backgroundImage: "url('/background.png')"
        }}
      >
        {/* Sidebar - Luôn hiển thị nhưng có thể bị ẩn bằng transform */}
        <div 
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <UserProvider>
          <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <Header 
              isSidebarOpen={isSidebarOpen} 
              setIsSidebarOpen={setIsSidebarOpen}
              user={user}
            />
            <main className="flex-1 w-full max-w-screen-2xl mx-auto">
              {children}
            </main>
            <ChatInput
              isSidebarOpen={isSidebarOpen}
              pathname={pathname}
            />
          </div>
        </UserProvider>

      </body>
    </html>
  );
}