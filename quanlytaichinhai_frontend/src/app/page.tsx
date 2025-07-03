"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, User } from "lucide-react"
import { LoadingIndicator } from "@/components/LoadingIndicator"
import { MessageItem } from "@/components/MessageItem"
import QuickActions from "@/components/QuickActions"
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
//   const fetchAIResponse = async (userMessage: string): Promise<string> => {
//   try {
//     const response = await fetch("/api/ai", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message: userMessage })
//     })
    
//     if (!response.ok) throw new Error("Lỗi API")
//     const data = await response.json()
//     return data.reply
//   } catch (error) {
//     console.error("Lỗi OpenAI:", error)
//     return "Xin lỗi, tôi đang bận. Vui lòng thử lại sau."
//   }
// }

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
    // Giả lập loading bằng setTimeout
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
    }, 1500) //  1.5 giây loading

    // Gọi AI và nhận phản hồi
    //const aiResponse = await fetchAIResponse(message)
     
  }

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    // Danh sách từ khóa điều hướng (không phân biệt vị trí trong câu)
    const NAV_TRIGGERS = [
      'đến trang', 'vào trang','qua trang',
      'đưa tôi đến', 'đưa tôi tới', 'đi tới', 'đi đến',
      'tôi muốn vào', 'mở trang', 'chuyển tới', 'chuyển đến',
      'nhảy tới', 'hiển thị trang'
    ];

    // Kiểm tra có phải là yêu cầu điều hướng không
    const isNavigationRequest = NAV_TRIGGERS.some(trigger => 
      lowerMessage.includes(trigger)
    );

    

    // ======================= Xử lý yêu cầu điều hướng ==========================
    if (isNavigationRequest) {

      // 1.Lịch sử giao dịch
      if (/lịch sử|giao dịch gần đây|history/i.test(lowerMessage)) {
        window.postMessage({
          type: 'NAVIGATE',
          payload: { path: '/history', target: 'transactions-history' }
        }, '*');
        return "📜 Đang tải lịch sử giao dịch...";
      }

      // 2. Thống kê
      if (/thống kê|báo cáo|analytics|stats/i.test(lowerMessage)) {
        window.postMessage({
          type: 'NAVIGATE',
          payload: { path: '/thongke', target: 'stats-section' }
        }, '*');
        return "📈 Đang mở báo cáo thống kê...";
      }
    }
    // Xử lý tìm kiếm
     // Xử lý tìm kiếm với regex đồng bộ với aiFilterHelper
    const searchMatch = userMessage.match(/(?:tìm kiếm|tìm|search)\s*(?:giao dịch|transaction)?\s*(.+)/i);
    if (searchMatch) {
      const rawKeyword = searchMatch[1].trim();
      const cleanedKeyword = rawKeyword
        .replace(/giao dịch|transaction/gi, '')
        .trim();
      
      if (cleanedKeyword) {
        window.postMessage({
          type: 'SEARCH',
          payload: { keyword: cleanedKeyword }
        }, '*');
        
        if (!window.location.pathname.includes('/history')) {
          return `🔍 Đang chuyển đến trang lịch sử để tìm kiếm "${cleanedKeyword}"...`;
        }
        return `🔎 Đang tìm kiếm "${cleanedKeyword}"...`;
      }
      return "Vui lòng nhập từ khóa tìm kiếm. Ví dụ: \"Tìm kiếm Starbucks\"";
    }


    //===========================DÙNG FILTER ĐỂ LỌC==============================================================
          //Lọc chi tiêu hoặc giao dịch
    if (/lịch sử chi tiêu|giao dịch chi tiêu|lọc chi tiêu|xem chi tiêu|tiền ra|mua sắm|thanh toán/i.test(lowerMessage)) {
      window.postMessage({
        type: 'FILTER',
        payload: {
          message: 'lọc loại giao dịch chi tiêu' // hoặc: 'filter type=expense'
        }
      }, '*')

      if (!window.location.pathname.includes('/history')) {
        return "💸 Đang chuyển đến trang lịch sử giao dịch chi tiêu...";
      }

      return "🔍 Đang lọc các giao dịch chi tiêu...";
    }
    // ===================Xử lý yêu cầu lọc lịch sử theo category=======================
    if (/lịch sử ăn uống|giao dịch ăn uống|chi tiêu ăn uống|đồ ăn|thức ăn/i.test(lowerMessage)) {
      // Gửi message đến trang history để áp dụng filter
      window.postMessage({
        type: 'FILTER',
        payload: {
          message: 'filter category=Ăn uống' // Đảm bảo khớp với category trong database
        }
      }, '*');

      // Nếu đang ở trang khác, thông báo sẽ chuyển trang
      if (!window.location.pathname.includes('/history')) {
        return "🍔 Đang chuyển đến trang lịch sử với các giao dịch ăn uống...";
      }
      
      return "🍽️ Đang lọc các giao dịch ăn uống...";
    }


    // ===================Xử lý yêu cầu lọc lịch sử theo tháng=======================
      const matchMonth = lowerMessage.match(/tháng\s*(\d{1,2})/);
      if (matchMonth) {
        const rawMonth = matchMonth[1];
        const month = rawMonth.padStart(2, '0'); // "6" → "06", "11" → "11"

        // Gửi message đến trang history
        window.postMessage({
          type: 'FILTER',
          payload: {
            message: `lọc giao dịch tháng ${parseInt(month)}`
          }
        }, '*');

        if (!window.location.pathname.includes('/history')) {
          return `🗓️ Đang chuyển đến lịch sử giao dịch tháng ${parseInt(month)}...`;
        }

        return `🔎 Đang lọc các giao dịch trong tháng ${parseInt(month)}...`;
      }

      



    // ===============Xử lý hỏi đáp thông thường (không chứa từ khóa điều hướng =======================
    if (/số dư|balance/i.test(lowerMessage)) {
      return "💰 Số dư hiện tại của bạn là 15.750.000 ₫";
    }

    if (/chi tiêu|spending/i.test(lowerMessage)) {
      return "💸 Tháng này bạn đã chi tiêu 4.200.000 ₫";
    }
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



  return "🤖 Tôi có thể giúp bạn lập kế hoạch tiết kiệm, phân tích chi tiêu và đưa ra lời khuyên tài chính.\n\nVí dụ:\n• \"Tôi muốn tiết kiệm 50 triệu trong 2 năm\"\n• \"Xem thống kê chi tiêu\"\n• \"Gợi ý đầu tư an toàn\"\n\nBạn muốn bắt đầu với gì?";
    
  }

  const handleQuickAction = (action: string) => {
    handleSendMessage(action)
  }
  //Date = ngày hiện tại thì lưu còn ngược lại thì xóa
  useEffect(() => {
    const stored = localStorage.getItem("chatHistory")
    if (stored) {
      const { date, messages: savedMessages } = JSON.parse(stored)
      const today = new Date().toDateString()
      if (date === today) {
        // Convert lại timestamp từ string → Date
        const restoredMessages = savedMessages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        setMessages(restoredMessages)
      } else {
        localStorage.removeItem("chatHistory")
      }
    }
  }, [])

  //Dùng khi một hành động ở trang khác yêu cầu chat bot trả lời
  useEffect(() => {
    const pending = localStorage.getItem("pendingChatMessage");
    if (pending) {
      localStorage.removeItem("pendingChatMessage");
      setTimeout(() => {
        handleSendMessage(pending);
      }, 300); // ⏱ chờ render xong rồi mới gửi (mượt)
    }
  }, []);

    

  // Cho phép các thành phần khác trong ứng dụng truy cập chúng từ ngoài component ChatAI
  useEffect(() => {
    ;(window as any).sendChatMessage = handleSendMessage
    ;(window as any).setInputValue = setInputValue
    ;(window as any).inputValue = inputValue
  }, [inputValue])

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("chatHistory", JSON.stringify({
        date: new Date().toDateString(),
        messages
      }))
    }
  }, [messages])
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50) // trì hoãn 50ms cho nội dung render xong

    return () => clearTimeout(timeout)
  }, [messages])



  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {isLoading && <LoadingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <QuickActions onAction={handleQuickAction} />
    </div>
  )
}


