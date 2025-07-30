'use client';
import axiosInstance from '@/config/axios';
import { useEffect, useState } from 'react';
import { MessageSquare } from "lucide-react"
interface QuickActionsProps {
  userId: number;
  onAction: (action: string) => void;
}

interface ActionItem {
  text: string;
  freq: number; // nếu backend trả về số lần
}

export const QuickActions = ({ userId, onAction }: QuickActionsProps) => {
  const [actions, setActions] = useState<ActionItem[]>([]);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await axiosInstance.get(`/quickactions?user_id=${userId}`);
        const data = res.data; // ✅ Không cần .json() khi dùng axios
        setActions(data); // dạng: [{ text: "...", freq: ... }, ...]
      } catch (error) {
        console.error("Lỗi lấy quick actions:", error);
      }
    };

    fetchActions();
  }, [userId]);

 return (
    <div className="fixed bottom-24 left-0 right-0 z-20">
      {" "}
      {/* Đặt vị trí cố định, nằm trên ChatInput */}
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action.text)}
              className="px-3 py-2 rounded-full bg-teal-50 hover:bg-teal-100 text-sm text-teal-700 flex items-center gap-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-teal-600" /> {/* Thay emoji bằng Lucide icon */}
              {action.text.length > 30 ? action.text.slice(0, 30) + "..." : action.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
};

export default QuickActions;
