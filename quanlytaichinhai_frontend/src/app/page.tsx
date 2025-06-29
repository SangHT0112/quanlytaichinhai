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
      content: "Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Gọi API AI (OpenAI hoặc local)
  const fetchAIResponse = async (userMessage: string): Promise<string> => {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    })
    
    if (!response.ok) throw new Error("Lỗi API")
    const data = await response.json()
    return data.reply
  } catch (error) {
    console.error("Lỗi OpenAI:", error)
    return "Xin lỗi, tôi đang bận. Vui lòng thử lại sau."
  }
}

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    // Thêm tin nhắn người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    // ⏱ Giả lập loading bằng setTimeout
  setTimeout(() => {
    const aiResponse = generateAIResponse(message)

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      role: "assistant",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiMessage])
    setIsLoading(false)
  }, 1500) // ⏱ 1.5 giây loading

    // Gọi AI và nhận phản hồi
    //const aiResponse = await fetchAIResponse(message)
     
  }

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes(" xem số dư")) {
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

   if (lowerMessage.includes("số dư") || lowerMessage.includes("tiền")) {
    return "💰 Số dư hiện tại của bạn là 15.750.000 ₫. Bạn muốn phân tích thêm về chi tiêu hoặc tiết kiệm không?";
  }

  if (lowerMessage.includes("chi tiêu") || lowerMessage.includes("tiêu")) {
    return "📊 Bạn đã chi tiêu 4.200.000 ₫ trong tháng này.\n\n• Ăn uống: 1.500.000 ₫\n• Di chuyển: 900.000 ₫\n• Giải trí: 750.000 ₫\n\nBạn muốn tôi gợi ý cách cắt giảm không?";
  }

  if (lowerMessage.includes("thu nhập") || lowerMessage.includes("lương")) {
    return "📈 Thu nhập tháng này là 8.500.000 ₫. Tỷ lệ tiết kiệm đạt 50.6% – rất tốt!";
  }

  if (lowerMessage.includes("lời khuyên") || lowerMessage.includes("khuyên")) {
    return "💡 Lời khuyên:\n• Duy trì tiết kiệm đều mỗi tháng\n• Nấu ăn tại nhà để giảm chi tiêu\n• Tạo quỹ khẩn cấp\n• Đầu tư an toàn nếu có thể";
  }

  if (lowerMessage.includes("đầu tư")) {
    return "📈 Gợi ý đầu tư:\n• Quỹ đầu tư cân bằng (30-40%)\n• Gửi tiết kiệm kỳ hạn (20-30%)\n• Vàng hoặc bất động sản nếu có vốn\n\n⚠️ Đừng đầu tư số tiền bạn không thể mất.";
  }

  if (lowerMessage.includes("tiết kiệm") && lowerMessage.includes("50 triệu") && lowerMessage.includes("2 năm")) {
    return "🎯 Bạn muốn tiết kiệm 50 triệu trong 2 năm. Vui lòng nhập lương hàng tháng của bạn để tôi tính toán lộ trình tiết kiệm.";
  }

  if (lowerMessage.includes("tôi có lương") || lowerMessage.includes("thu nhập mỗi tháng")) {
    return "📌 Cảm ơn bạn! Bạn có ở trọ không? Nếu có, cho biết tiền thuê mỗi tháng nhé.";
  }

  if (lowerMessage.includes("trọ") && lowerMessage.includes("1 triệu")) {
    return "✅ Đã ghi nhận tiền trọ 1 triệu. Bạn có khoản chi cố định nào khác mỗi tháng không? (ví dụ: ăn uống, xăng xe, giải trí...)";
  }

  return "🤖 Tôi có thể giúp bạn lập kế hoạch tiết kiệm, phân tích chi tiêu và đưa ra lời khuyên tài chính.\n\nVí dụ:\n• \"Tôi muốn tiết kiệm 50 triệu trong 2 năm\"\n• \"Xem thống kê chi tiêu\"\n• \"Gợi ý đầu tư an toàn\"\n\nBạn muốn bắt đầu với gì?";
    
  }

  const handleQuickAction = (action: string) => {
    handleSendMessage(action)
  }
  useEffect(() => {
    const pending = localStorage.getItem("pendingChatMessage");
    if (pending) {
      localStorage.removeItem("pendingChatMessage");
      setTimeout(() => {
        handleSendMessage(pending);
      }, 300); // ⏱ chờ render xong rồi mới gửi (mượt)
    }
  }, []);

    

  // Expose the handleSendMessage function to the parent layout
  useEffect(() => {
    ;(window as any).sendChatMessage = handleSendMessage
    ;(window as any).setInputValue = setInputValue
    ;(window as any).inputValue = inputValue
  }, [inputValue])

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

      {/* Quick Actions */}
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
