"use client"
import { useState, useEffect } from "react"
import { Bot, User } from "lucide-react"
import type { ChatMessage, StructuredData, TransactionData, PlanData } from "../utils/types"
import { MessageRenderer } from "./MessageRenderer"
import type { MessageContentPart } from "../utils/types"
import SingleTransactionConfirmationForm from "./transaction-form/SingleTransactionConfirmationForm"
import MultiTransactionConfirmationForm from "./transaction-form/MultiTransactionConfirmationForm"
import TransactionEditForm from "./transaction-form/TransactionEditForm"
import { renderCustomContent } from "./hooks/renderCustomContent"
import BackgroundImageConfirmForm from "./transaction-form/ComfirmImage"
import CategoryConfirmationForm from "./transaction-form/CategoryConfirmationForm"
import { PriorityForm } from "./transaction-form/priority-form"
import { ConfirmedTransactionForm } from "./transaction-form/confirmed-transaction-form"
import { ConfirmedMultiTransactionForm} from "./transaction-form/ConfirmedMultiTransactionForm"
import axiosInstance from "@/config/axios"
import { extractSqlQueryData } from "../utils/messageHelper"
import { useRouter } from "next/navigation" // Nếu dùng Next.js

const isConfirmPriority = (
  data: StructuredData | undefined,
): data is Extract<StructuredData, { response_type: "confirm_priority" }> => {
  if (!data) return false
  let parsedData = data
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data)
    } catch (e) {
      console.error("Lỗi parse structured data for priority:", e, { data })
      return false
    }
  }
  return (
    typeof parsedData === "object" &&
    "response_type" in parsedData &&
    parsedData.response_type === "confirm_priority" &&
    "temp_plans" in parsedData &&
    Array.isArray(parsedData.temp_plans) &&
    "priority_options" in parsedData &&
    Array.isArray(parsedData.priority_options) &&
    "message" in parsedData &&
    typeof parsedData.message === "string"
  )
}

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
  let parsedData = data
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data)
    } catch (e) {
      console.error("Lỗi parse structured data:", e, { data })
      return false
    }
  }
  if (parsedData && typeof parsedData === "object" && "message" in parsedData && !("type" in parsedData)) {
    return false
  }
  return !("type" in parsedData) || parsedData.type !== "component"
}

const isSuggestNewCategory = (
  data: StructuredData | undefined,
): data is Extract<StructuredData, { response_type: "suggest_new_category" }> => {
  if (!data) return false
  let parsedData = data
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data)
    } catch (e) {
      console.error("Lỗi parse structured data for category:", e, { data })
      return false
    }
  }
  return (
    typeof (parsedData as { response_type?: string }).response_type === "string" &&
    (parsedData as { response_type?: string }).response_type === "suggest_new_category"
  )
}

// Trong MessageItem hoặc utils
const cleanMarkdownContent = (content: string): string => {
  return content
    .replace(/```(?:json|sql)\s*[\s\S]*?```/g, "") // Remove code blocks
    .replace(/\*\*(.*?)\*\*/g, "$1") // Unbold markdown
    .trim()
}

const hasImageUrl = (
  data: StructuredData,
): data is {
  transactions?: Array<{
    type: "expense" | "income"
    amount: number
    category: string
    date?: string
    user_id?: number
    description?: string
    transaction_date?: string
  }>
  group_name?: string
  total_amount?: number
  transaction_date?: string
  image_url?: string
} => {
  let parsedData = data
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data)
    } catch (e) {
      console.error("Lỗi parse structured data for image:", e, { data })
      return false
    }
  }
  return "image_url" in parsedData
}

export const MessageItem = ({
  message,
  onConfirm,
  confirmedIds = [],
  onSaveEdit,
}: {
  message: ChatMessage
  onConfirm?: (message: ChatMessage, correctedData?: TransactionData | TransactionData[]) => Promise<void>
  confirmedIds?: string[]
  onSaveEdit?: (messageId: string, editedData: TransactionData, editingIndex: number) => Promise<void>
}) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isPriorityConfirmed, setIsPriorityConfirmed] = useState(confirmedIds.includes(message.id))
  const groupTransactionDate = (message.structured as { transaction_date?: string })?.transaction_date

  const [pendingTransaction, setPendingTransaction] = useState<TransactionData | null>(null)
  const [isCategoryConfirmed, setIsCategoryConfirmed] = useState(confirmedIds.includes(message.id))
  // const [isTransactionConfirmed, setIsTransactionConfirmed] = useState(confirmedIds.includes(message.id));
  const isComponentStructured = (data: StructuredData | undefined): data is MessageContentPart & { type: "component" } => {
    if (!data) return false
    let parsedData = data
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data)
      } catch {
        return false
      }
    }
    return typeof parsedData === "object" && "type" in parsedData && parsedData.type === "component"
  }

  // Thêm state để track confirmed cho pending transaction riêng biệt nếu cần
  const [isPendingConfirmed, setIsPendingConfirmed] = useState(false)

  useEffect(() => {
    const storedPending = localStorage.getItem(`pendingTransaction_${message.id}`)
    if (storedPending) {
      setPendingTransaction(JSON.parse(storedPending))
    }
  }, [message.id])

  const transactions: TransactionData[] =
    message.structured &&
    isTransactionStructuredData(message.structured) &&
    Array.isArray(
      (typeof message.structured === "string" ? JSON.parse(message.structured) : message.structured).transactions,
    )
      ? (typeof message.structured === "string" ? JSON.parse(message.structured) : message.structured).transactions.map(
          (tx) => ({
            type: tx.type || "expense",
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            user_id: tx.user_id ?? 1,
            description: tx.description || message.user_input || message.content || "Không có mô tả",
            transaction_date: tx.transaction_date || groupTransactionDate || new Date().toISOString(),
          }),
        )
      : []

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

  const isTransaction = transactions.length > 0
  const isSingleTransaction = transactions.length === 1
  const isMultiTransaction = transactions.length > 1
  const hasCustomContent =
    Array.isArray(message.custom_content) &&
    message.custom_content.some((part) => part.type === "component" || part.type === "function_call")

  // Kiểm tra xem có chart component không
  const chartComponents = ["WeeklyBarChart", "MonthlyBarChart", "DailySpendingAreaChart", "ExpensePieChart"]
  const checkIfChartComponent = (name: string | undefined): boolean => {
    if (!name) return false
    const cleanName = name.replace(/^render_/, "")
    return chartComponents.includes(cleanName)
  }

  const hasChartComponent =
    (Array.isArray(message.custom_content) &&
      message.custom_content.some((part: MessageContentPart) => {
        if (part.type !== "component" && part.type !== "function_call") return false;
        return checkIfChartComponent(part.name);
      })) ||
    (message.structured &&
      isComponentStructured(message.structured) &&
      checkIfChartComponent(message.structured.name))

  // Sử dụng confirmed từ prop để nhất quán
  const isMessageConfirmed = confirmedIds.includes(message.id)

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
    setIsLoading(true)
    try {
      await onSaveEdit?.(message.id, editedData, editingIndex)
      setIsEditing(false)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleCategoryConfirm = async (confirmed: boolean, transactionData?: TransactionData) => {
    if (confirmed) {
      setIsCategoryConfirmed(true)
      if (transactionData) {
        setPendingTransaction(transactionData)
        localStorage.setItem(`pendingTransaction_${message.id}`, JSON.stringify(transactionData))
      } else {
        await onConfirm?.(message)
      }
    } else {
      setIsCategoryConfirmed(false)
      setPendingTransaction(null)
      localStorage.removeItem(`pendingTransaction_${message.id}`)
    }
  }

  const handleTransactionConfirm = async (transactionData: TransactionData) => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm(message, transactionData)
        // setIsTransactionConfirmed(true);
        setIsPendingConfirmed(true) // Cập nhật state cho pending
        localStorage.removeItem(`pendingTransaction_${message.id}`)
      } finally {
        setIsLoading(false)
      }
    }
  }
  const handlePriorityConfirm = async (priority: string) => {
    if (isLoading) {
      console.log("Request already in progress, ignoring duplicate request")
      return // Ngăn gửi lại nếu đang xử lý
    }
    console.log("Priority sent to server:", priority)
    if (!message.structured || !isConfirmPriority(message.structured)) {
      console.error("Invalid structured data for priority confirmation")
      return
    }
    setIsLoading(true)
    try {
      const response = await axiosInstance.post("/ai/confirm-priority", {
        user_id: message.user_id ?? 1,
        selected_priority: priority,
        temp_plans: message.structured.temp_plans,
      })

      if (!response.data.success) {
        throw new Error("Lỗi khi xác nhận mức ưu tiên")
      }

      setIsPriorityConfirmed(true)
      if (onConfirm) {
        await onConfirm(message)
      }

      // Kiểm tra và chuyển hướng nếu có redirectPath
      if (response.data.redirectPath) {
        router.push(response.data.redirectPath) // Chuyển hướng đến /financial_plan
      }
    } catch (error) {
      console.error("Lỗi khi gửi xác nhận ưu tiên:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const { text: displayText, followup, hasSqlData } = extractSqlQueryData(message)

  return (
    <div className={`flex w-full mb-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse-subtle">
          <Bot className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
      <div
        className={`
          flex flex-col
          ${
            hasChartComponent
              ? "max-w-[100%] sm:max-w-[95%] md:max-w-[95%] lg:max-w-[95%]"
              : "max-w-[80%] sm:max-w-[70%] md:max-w-[60%]"
          }
          min-w-[120px]
          rounded-2xl px-4 py-3
          break-words
          ${
           message.role === "user" 
           ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-none shadow-xl shadow-blue-600/30 border border-blue-500/30"
           : "bg-gradient-to-br from-white via-purple-50 to-pink-50 text-slate-800 border-2 border-purple-200/50 rounded-bl-none shadow-xl shadow-purple-300/40"
          }
          ${hasCustomContent || hasChartComponent ? "!min-w-[600px]" : ""}
          transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
          backdrop-blur-sm
        `}
      >
        {message.structured && isComponentStructured(message.structured) && (
          <div className="mt-2 w-full [&_*]:drop-shadow-sm">
            {renderCustomContent(message.structured as MessageContentPart)}
          </div>
        )}

        {!isTransaction && !hasCustomContent && !isComponentStructured(message.structured) && (
          <div className="mt-2 [&_p]:text-shadow-sm [&_strong]:text-shadow-md [&_strong]:font-bold">
            {hasSqlData && displayText ? (
              <MessageRenderer content={displayText} role={message.role} />
            ) : message.content ? (
              <MessageRenderer content={cleanMarkdownContent(message.content)} role={message.role} />
            ) : null}
          </div>
        )}

        {message.role === "assistant" && hasSqlData && followup && (
          <div className="flex flex-col gap-3 mt-3 items-end">
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg shadow-green-500/40 hover:shadow-xl hover:shadow-green-500/60 font-semibold"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("send-chat", {
                      detail: followup.suggestedQuery,
                    }),
                  )
                }
              >
                ✔️ Có
              </button>

              <button
                className="px-4 py-2 bg-gradient-to-r from-rose-400 via-red-400 to-pink-400 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg shadow-red-400/40 hover:shadow-xl hover:shadow-red-400/60 font-semibold"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("send-chat", {
                      detail: "Không, cảm ơn",
                    }),
                  )
                }
              >
                ✖️ Không
              </button>
            </div>
          </div>
        )}

        {/* Các block cũ giữ nguyên */}
        {message.structured && isConfirmPriority(message.structured) && !isPriorityConfirmed && (
          <div className="mt-2">
            <PriorityForm
              onPrioritySelect={handlePriorityConfirm}
              plans={message.structured.temp_plans as PlanData[]}
            />
          </div>
        )}

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
                  <div className="space-y-4">
                    {isMessageConfirmed ? (
                      <ConfirmedTransactionForm transaction={transactions[0]} />
                    ) : (
                      <SingleTransactionConfirmationForm
                        transactionData={transactions[0]}
                        isConfirmed={false}
                        onConfirm={() => onConfirm?.(message, transactions[0])}
                        onEdit={() => handleStartEdit(0)}
                      />
                    )}
                  </div>
                )}
                {isMultiTransaction && message.structured && isTransactionStructuredData(message.structured) && (
                  <div className="space-y-4">
                    {isMessageConfirmed ? (
                      <ConfirmedMultiTransactionForm
                        groupName={message.structured.group_name || ""}
                        transactionDate={message.structured.transaction_date || new Date().toISOString()}
                        transactions={transactions}
                        totalAmount={message.structured.total_amount || 0}
                      />
                    ) : (
                      <MultiTransactionConfirmationForm
                        groupName={message.structured.group_name || ""}
                        transactionDate={message.structured.transaction_date || new Date().toISOString()}
                        transactions={transactions}
                        totalAmount={message.structured.total_amount || 0}
                        isConfirmed={false}
                        onConfirmAll={handleConfirmAll}
                        onEdit={handleStartEdit}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {message.structured && isSuggestNewCategory(message.structured) && (
          <div className="mt-2">
            <CategoryConfirmationForm
              categoryData={message.structured.suggest_new_category}
              user_id={message.structured.temporary_transaction?.user_id ?? 1}
              messageId={message.id}
              onConfirm={handleCategoryConfirm}
              temporary_transaction={message.structured.temporary_transaction}
              isConfirmed={isCategoryConfirmed}
            />
          </div>
        )}

        {pendingTransaction && (
          <div className="mt-2 space-y-4">
            {isEditing ? (
              <TransactionEditForm
                initialData={editedData}
                onChange={handleEditChange}
                onCancel={handleCancelEdit}
                onSave={handleSaveEdit}
                isLoading={isLoading}
              />
            ) : isPendingConfirmed || isMessageConfirmed ? (
              <ConfirmedTransactionForm transaction={pendingTransaction} />
            ) : (
              <SingleTransactionConfirmationForm
                transactionData={pendingTransaction}
                isConfirmed={false}
                onConfirm={() => handleTransactionConfirm(pendingTransaction)}
                onEdit={() => {
                  setEditedData(pendingTransaction)
                  setIsEditing(true)
                }}
              />
            )}
          </div>
        )}

        {message.structured && hasImageUrl(message.structured) && typeof message.structured.image_url === "string" && (
          <BackgroundImageConfirmForm imageUrl={message.structured.image_url} />
        )}

        {message.custom_content?.map((part, index) => (
          <div key={index} className="mt-2 w-full">
            {" "}
            {/* Thêm w-full cho custom_content để rộng hơn */}
            {renderCustomContent(part)}
          </div>
        ))}

        <div
          className={`text-xs mt-2 font-medium ${message.role === "user" ? "text-cyan-100 drop-shadow-sm" : "text-purple-600 drop-shadow-sm"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {message.role === "user" && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500 rounded-full flex items-center justify-center ml-2 shadow-lg shadow-blue-400/50">
          <User className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  )
}