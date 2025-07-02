"use client"

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ChatInputProps {
  isSidebarOpen: boolean;
}

export default function ChatInput({ isSidebarOpen }: ChatInputProps) {
  const [chatInput, setChatInput] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const handleSend = () => {
    const message = chatInput.trim();
    if (!message) return;

    // 1. Lưu tin nhắn vào localStorage để ChatAI tự gửi
    localStorage.setItem("pendingChatMessage", message);

    // 2. Gửi message lọc
    window.postMessage({
      type: "FILTER",
      payload: { message }
    }, "*");

    // 3. Reset input
    setChatInput("");

    // 4. Chuyển đến trang chat nếu chưa đúng
    if (pathname !== "/") {
      router.replace("/");
    }
  }

  return (
    <div className={`fixed bottom-4 z-50 transition-all duration-300 ${isSidebarOpen ? 'left-64' : 'left-0'} right-0`}>
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 space-y-2 shadow-xl">
          <div className="flex items-center gap-2">
            <button className="text-purple-400 text-xl">🤖</button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập yêu cầu tài chính hoặc ví dụ..."
              className="flex-1 px-4 py-2 rounded-full bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none"
            />

            <button
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full"
              onClick={handleSend}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
                   className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4.5 12l15 6V6l-15 6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
