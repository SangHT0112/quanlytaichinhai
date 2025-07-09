// components/Chat/QuickActions.tsx
'use client'

// Định nghĩa props interface ngay trong file
interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions = (props: QuickActionsProps) => {
  const { onAction } = props;
  
  const actions = [
    { text: "Lịch sử giao dịch", emoji: "📜", prompt: "Vào trang lịch sử giao dịch gần đây" },
    { text: "Lịch sử ăn uống", emoji:"📈", prompt: "Vào trang lịch sử và xem mục ăn uống" },
    { text: "Tìm giao dịch ăn uống", emoji:"🍔", prompt: "Tìm kiếm giao dịch ăn uống" },

    // ✅ Mới thêm
    { text: "Tổng quan số dư", emoji: "🧾", prompt: "Tổng quan về số dư" },
    { text: "Chi tiêu nhiều", emoji: "🔥", prompt: "Các danh mục chi tiêu nhiều" },
    { text: "Xem chi tiêu trong tuần này", emoji: "📈", prompt: "Xem chi tiêu trong tuần này"}
  ]


  return (
    <div className="border-t border-zinc-800 pt-4">
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onAction(action.prompt)}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            {action.emoji} {action.text}
          </button>
        ))}
      </div>
    </div>
  );
};

// Thêm kiểu export cho component
export default QuickActions;