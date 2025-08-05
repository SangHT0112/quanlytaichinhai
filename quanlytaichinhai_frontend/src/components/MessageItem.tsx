"use client"

import { useState } from "react"
import { Bot, User } from "lucide-react" // Import DollarSign icon
import type { ChatMessage, StructuredData, TransactionData } from "./types" // Đảm bảo các types này đã được định nghĩa
import { MessageRenderer } from "./MessageRenderer" // Đảm bảo component này đã được định nghĩa
import SingleTransactionConfirmationForm from "./transaction-form/SingleTransactionConfirmationForm" // Đảm bảo component này đã được định nghĩa
import MultiTransactionConfirmationForm from "./transaction-form/MultiTransactionConfirmationForm" // Đảm bảo component này đã được định nghĩa
import TransactionEditForm from "./transaction-form/TransactionEditForm" // Đảm bảo component này đã được định nghĩa
import { renderCustomContent } from "./hooks/renderCustomContent" // Đảm bảo hook này đã được định nghĩa
import BackgroundImageConfirmForm from "./transaction-form/ComfirmImage"
// Type guard để kiểm tra StructuredData dạng transactions
const isTransactionStructuredData = (
  data: StructuredData,
): data is {
  transactions?: Array<{
    type: "expense" | "income"
    category: string
    amount: number
    user_id?: number
    date?: string
    transaction_date?: string
    description?: string
  }>
  group_name?: string
  total_amount?: number
  transaction_date?: string
} => {
  return !("type" in data) || data.type !== "component"
}

function hasImageUrl(data: StructuredData): data is {
  transactions?: Array<{
    type: 'expense' | 'income';
    amount: number;
    category: string;
    date?: string;
    user_id?: number;
    description?: string;
    transaction_date?: string;
  }>;
  group_name?: string;
  total_amount?: number;
  transaction_date?: string;
  image_url?: string;
} {
  return 'image_url' in data;
}


export const MessageItem = ({
  message,
  onConfirm,
  confirmedIds = [],
  onSaveEdit,
}: {
  message: ChatMessage;
  onConfirm?: (message: ChatMessage, correctedData?: TransactionData | TransactionData[]) => Promise<void>;
  confirmedIds?: string[];
  onSaveEdit?: (messageId: string, editedData: TransactionData, editingIndex: number) => Promise<void>; // Cập nhật chữ ký
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const groupTransactionDate = (message.structured as { transaction_date?: string })?.transaction_date;
  // Lấy transactions từ structured và đảm bảo khớp với TransactionData
  const transactions: TransactionData[] =
    message.structured &&
    isTransactionStructuredData(message.structured) &&
    Array.isArray(message.structured.transactions)
      ? message.structured.transactions.map((tx) => ({
          type: tx.type || "expense",
          amount: tx.amount, // amount là bắt buộc
          category: tx.category, // category là bắt buộc
          date: tx.date,
          user_id: tx.user_id ?? 1,
          description: tx.description || message.user_input || message.content || "Không có mô tả",
         transaction_date: tx.transaction_date || groupTransactionDate || new Date().toISOString(),
        }))
      : []

  // Transaction mặc định để edit
  const defaultTransaction: TransactionData = transactions[editingIndex] || {
    type: "expense",
    amount: 0,
    category: "",
    user_id: 1,
    date: new Date().toISOString(),
    description: message.user_input || message.content || "Không có mô tả",
    transaction_date: new Date().toISOString(),
  }

  const [editedData, setEditedData] = useState<TransactionData>({
    ...defaultTransaction,
  })

  // Kiểm tra các trạng thái
  const isTransaction = transactions.length > 0
  const isSingleTransaction = transactions.length === 1
  const isMultiTransaction = transactions.length > 1
  const hasCustomContent =
    Array.isArray(message.custom_content) &&
    message.custom_content.some((part) => part.type === "component" || part.type === "function_call")

  const handleEditChange = (field: keyof TransactionData, value: string | number) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
      user_id: prev.user_id ?? 1,
      description: field === "description" ? (value as string) : prev.description,
      transaction_date: field === "date" ? (value as string) : prev.transaction_date,
    }))
  }

 const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      await onSaveEdit?.(message.id, editedData, editingIndex); // Truyền thêm editingIndex
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedData({
      ...(transactions[editingIndex] || defaultTransaction),
    })
    setIsEditing(false)
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditedData({
      ...transactions[index],
    })
    setIsEditing(true)
  }

  const handleConfirmAll = async () => {
    setIsLoading(true)
    try {
      if (onConfirm) {
        await onConfirm(message, transactions)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex gap-3 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`
          max-w-[min(90vw,800px)]
          w-fit min-w-[120px] min-h-[4rem]
          rounded-2xl px-4 py-3 overflow-x-auto break-words
          ${message.role === "user" ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white" : "bg-white/90 text-slate-700 border border-slate-200/50"}
          ${hasCustomContent ? "!min-w-[300px]" : ""}
        `}
      >
        {/* Hiển thị nội dung thông thường nếu không phải transaction */}
        {!isTransaction && !hasCustomContent && message.content && (
          <div className="mt-2">
            <MessageRenderer content={message.content} />
          </div>
        )}
        {/* Phần xử lý transaction */}
        {isTransaction && (
          <div className="mt-2">
            {isEditing ? (
              <TransactionEditForm
                initialData={editedData}
                onChange={handleEditChange}
                onCancel={handleCancelEdit}
                onSave={handleSaveEdit}
                isLoading={isLoading}
              />
            ) : (
              <>
                {isSingleTransaction && (
                  <SingleTransactionConfirmationForm
                    transactionData={transactions[0]}
                    isConfirmed={confirmedIds.includes(message.id)}
                    onConfirm={() => onConfirm?.(message, transactions[0])}
                    onEdit={() => handleStartEdit(0)}
                  />
                )}
                {isMultiTransaction && message.structured && isTransactionStructuredData(message.structured) && (
                  <MultiTransactionConfirmationForm
                    groupName={message.structured.group_name || ""}
                    transactionDate={message.structured.transaction_date || new Date().toISOString()}
                    transactions={transactions}
                    totalAmount={message.structured.total_amount || 0}
                    isConfirmed={confirmedIds.includes(message.id)}
                    onConfirmAll={handleConfirmAll}
                    onEdit={handleStartEdit}
                  />
                )}
              </>
            )}
          </div>
        )}
        {/* Hiển thị hình ảnh nếu structured có image_path */}
       {message.structured &&
        hasImageUrl(message.structured) &&
        typeof message.structured.image_url === 'string' && (
          <BackgroundImageConfirmForm imageUrl={message.structured.image_url} />
        )}




        {/* Hiển thị custom content nếu có */}
        {message.custom_content?.map((part, index) => (
          <div key={index} className="mt-2">
            {renderCustomContent(part)}
          </div>
        ))}
        {/* Hiển thị thời gian */}
        <div className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-teal-100" : "text-slate-500"}`}>
          {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {message.role === "user" && (
        <div className="flex-shrink-0 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-slate-600" />
        </div>
      )}
    </div>
  )
}
