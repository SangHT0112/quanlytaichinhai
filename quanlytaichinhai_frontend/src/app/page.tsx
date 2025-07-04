"use client"

import { useState, useRef, useEffect } from "react"
import { LoadingIndicator } from "@/components/LoadingIndicator"
import { MessageItem } from "@/components/MessageItem"
import QuickActions from "@/components/QuickActions"
import { ChatMessage, MessageRole  } from "@/components/types"
import { MessageContent } from "@/components/types"
import { generateResponse } from "@/lib/ai/generateResponse"
import { generateAIResponse } from "@/lib/ai/generateAIResponse"
export default function ChatAI() {

  const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: "1",
    content: "Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...",
    role: MessageRole.ASSISTANT, // ✅ dùng enum thay vì chuỗi
    timestamp: new Date(),
  },
])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return
    
    // Thêm tin nhắn người dùng
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: MessageRole.USER,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    // Giả lập loading bằng setTimeout
    setTimeout(() => {
      const aiResponse = generateAIResponse(message) as MessageContent

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: typeof aiResponse === 'string' ? aiResponse : null,
      custom_content: Array.isArray(aiResponse) ? aiResponse : typeof aiResponse === 'object' ? [aiResponse] : undefined,
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500) //  1.5 giây loading

    // Gọi AI và nhận phản hồi
    //const aiResponse = await fetchAIResponse(message)
     
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


