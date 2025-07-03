'use client';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export const Header = ({ 
  isSidebarOpen, 
  setIsSidebarOpen,
  user
}: { 
  isSidebarOpen: boolean, 
  setIsSidebarOpen: (value: boolean) => void,
  user: { username: string } | null
}) => {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-black">
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
  );
};