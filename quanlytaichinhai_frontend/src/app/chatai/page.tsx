"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, User } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Xin chào! Tôi là AI Finance Manager. Tôi có thể giúp bạn quản lý tài chính, phân tích chi tiêu, đưa ra lời khuyên đầu tư và trả lời các câu hỏi về tài chính cá nhân. Bạn cần hỗ trợ gì hôm nay?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(
      () => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(message),
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    )
  }

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes("số dư") || lowerMessage.includes("tiền")) {
      return "Số dư hiện tại của bạn là 15.750.000 ₫. Đây là một mức số dư khá tốt! Bạn có muốn tôi phân tích chi tiết về tình hình tài chính không?"
    }

    if (lowerMessage.includes("chi tiêu") || lowerMessage.includes("tiêu")) {
      return "Tháng này bạn đã chi tiêu 4.200.000 ₫. Các khoản chi lớn nhất là:\n\n🍔 Ăn uống: 1.500.000 ₫\n🚗 Di chuyển: 900.000 ₫\n🎮 Giải trí: 750.000 ₫\n\nBạn có muốn tôi đưa ra lời khuyên để tối ưu chi tiêu không?"
    }

    if (lowerMessage.includes("thu nhập") || lowerMessage.includes("lương")) {
      return "Thu nhập tháng này của bạn là 8.500.000 ₫. Tỷ lệ tiết kiệm hiện tại là 50.6% - rất tốt! Bạn đang quản lý tài chính rất hiệu quả."
    }

    if (lowerMessage.includes("lời khuyên") || lowerMessage.includes("khuyên")) {
      return "Dựa trên phân tích tài chính của bạn, tôi có một số lời khuyên:\n\n💡 Tiếp tục duy trì tỷ lệ tiết kiệm cao\n💡 Có thể giảm chi tiêu ăn uống bằng cách nấu ăn tại nhà\n💡 Xem xét đầu tư một phần tiền tiết kiệm\n💡 Thiết lập quỹ khẩn cấp 6 tháng chi tiêu\n\nBạn muốn tôi giải thích chi tiết về điểm nào?"
    }

    if (lowerMessage.includes("đầu tư")) {
      return "Với số dư hiện tại và tỷ lệ tiết kiệm tốt, bạn có thể xem xét:\n\n📈 Quỹ đầu tư cân bằng (30-40%)\n🏦 Tiền gửi có kỳ hạn (20-30%)\n🏠 Bất động sản (nếu đủ vốn)\n💰 Vàng (5-10% để đa dạng hóa)\n\nLưu ý: Chỉ đầu tư số tiền bạn có thể chấp nhận rủi ro!"
    }

    return "Cảm ơn bạn đã hỏi! Tôi có thể giúp bạn về:\n\n💰 Phân tích số dư và thu chi\n📊 Thống kê chi tiêu theo danh mục\n💡 Lời khuyên tài chính cá nhân\n📈 Gợi ý đầu tư phù hợp\n📱 Lập kế hoạch ngân sách\n\nBạn muốn tìm hiểu về vấn đề nào?"
  }

  const handleQuickAction = (action: string) => {
    handleSendMessage(action)
  }

  // Expose the handleSendMessage function to the parent layout
  useEffect(() => {
    ;(window as any).sendChatMessage = handleSendMessage
    ;(window as any).setInputValue = setInputValue
    ;(window as any).inputValue = inputValue
  }, [inputValue])

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white border border-zinc-700"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              <div className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-blue-100" : "text-zinc-400"}`}>
                {message.timestamp.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div> 
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      Quick Actions
      <div className="border-t border-zinc-800 pt-4 mb-4">
        <div className="flex flex-wrap gap-2">
            
          <button
            onClick={() => handleQuickAction("Xem số dư hiện tại")}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            🟣 Xem số dư
          </button>
          <button
            onClick={() => handleQuickAction("Thống kê chi tiêu tháng này")}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            📊 Thống kê
          </button>
          <button
            onClick={() => handleQuickAction("Đưa ra lời khuyên tài chính")}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            💡 Lời khuyên
          </button>
          <button
            onClick={() => handleQuickAction("Gợi ý đầu tư phù hợp")}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            📈 Đầu tư
          </button>
          <button
            onClick={() => handleQuickAction("Gợi ý đầu tư phù hợp")}
            className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white flex items-center gap-2 transition-colors"
          >
            Lời khuyên
          </button>
        </div>
      </div>
    </div>
  )
}
