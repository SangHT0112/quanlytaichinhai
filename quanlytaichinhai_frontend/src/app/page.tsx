"use client"

import { useState, useRef, useEffect } from "react"
import { LoadingIndicator } from "@/components/LoadingIndicator"
import { MessageItem } from "@/components/MessageItem"
import QuickActions from "@/components/QuickActions"
import { ChatMessage, MessageRole  } from "@/components/types"
import { MessageContent } from "@/components/types"
import { generateResponse } from "@/lib/ai/generateResponse"
import { generateAIResponse } from "@/lib/ai/generateAIResponse"
import axiosInstance from "@/config/axios"
export default function ChatAI() {

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [confirmedIds, setConfirmedIds] = useState<string[]>([])

  const [pendingConfirmation, setPendingConfirmation] = useState<{
    message: ChatMessage
  } | null>(null)

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: MessageRole.USER,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setConfirmedIds((prev) => [...prev, userMessage.id])
    setInputValue("")
    setIsLoading(true)

    try {
      const res = await axiosInstance.post("/ai/chat", { message })
      const ai_suggested = res.data.raw
      const structured = res.data.structured

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: ai_suggested,
        structured,
        user_input: message, // ✅ gán input gốc vào
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error("❌ Lỗi khi gửi đến AI:", err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: "⚠️ Đã có lỗi xảy ra khi gửi đến AI.",
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ])
    }

    setIsLoading(false)
  }



  const handleQuickAction = (action: string) => {
    handleSendMessage(action)
  }

  const handleConfirm = async (message: ChatMessage) => {
    try {
      console.log("🚀 Xác nhận giao dịch:", {
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: null,
        confirmed: true,
      });

      await axiosInstance.post("/ai/confirm", {
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: null,
        confirmed: true,
      });

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "✅ Giao dịch đã được lưu vào hệ thống.",
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, successMessage])
      setConfirmedIds((prev) => [...prev, message.id]) // ✅ Ghi nhận ID đã xác nhận

    } catch (err) {
      console.error("❌ Lỗi xác nhận:", err)
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: "❌ Lỗi khi xác nhận và lưu giao dịch.",
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      }])
    }
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

     // ⬇️ Nếu chưa có gì trong localStorage → tạo mới 1 tin nhắn chào
  setMessages([
    {
      id: "1",
      content: "Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
  ])
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
          <MessageItem key={message.id} 
          message={message}  
          onConfirm={() => handleConfirm(message)}  
          isConfirmed={confirmedIds.includes(message.id)}
          confirmedIds={confirmedIds}    
       />
        ))}

        {isLoading && <LoadingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <QuickActions onAction={handleQuickAction} />
    </div>
  )
}


