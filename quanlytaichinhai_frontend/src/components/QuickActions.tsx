'use client';
import axiosInstance from '@/config/axios';
import { useEffect, useState } from 'react';

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
    <div className="border-t border-zinc-800 pt-4">
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onAction(action.text)}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            💬 {action.text.length > 30 ? action.text.slice(0, 30) + '...' : action.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
