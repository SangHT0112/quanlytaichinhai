"use client"

import type React from "react"

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  icon: string
  date: string
}

interface CategoryCardProps {
  categoryName: string
  icon: string
  items: Transaction[]
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: (id: number) => void
  maxInitialItems: number
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  categoryName,
  icon,
  items,
  isExpanded,
  onToggleExpand,
  onDelete,
  maxInitialItems,
}) => {
  const displayedItems = isExpanded ? items : items.slice(0, maxInitialItems)
  const hasMore = items.length > maxInitialItems

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-lg font-bold text-slate-900 truncate">{categoryName}</h3>
          <span className="ml-auto text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {items.length}
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100% - 120px)" }}>
        {displayedItems.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {displayedItems.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors duration-200 group">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{tx.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(tx.date).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "income" ? "+" : "−"}
                      {tx.amount.toLocaleString("vi-VN")} VNĐ
                    </p>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">Không có giao dịch</div>
        )}
      </div>

      {/* Footer - View More Button */}
      {hasMore && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onToggleExpand}
            className="w-full py-2 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {isExpanded ? `Thu gọn (${items.length} mục)` : `Xem thêm ${items.length - maxInitialItems} mục`}
          </button>
        </div>
      )}

      {/* Summary Footer */}
      {!hasMore && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="text-xs text-slate-600 text-center">{items.length} giao dịch</div>
        </div>
      )}
    </div>
  )
}

export default CategoryCard
