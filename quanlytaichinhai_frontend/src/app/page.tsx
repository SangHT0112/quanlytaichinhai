"use client"

import { useState, useRef, useEffect } from "react"
import { LoadingIndicator } from "@/components/LoadingIndicator"
import { MessageItem } from "@/components/MessageItem"
import QuickActions from "@/components/QuickActions"
import { ChatMessage, MessageRole } from "@/components/types"
import axiosInstance from "@/config/axios"
import { AllowedComponents } from "@/components/types"
// Helper để convert structured → custom_content
function convertStructuredToCustomContent(structured: any): ChatMessage["custom_content"] | undefined {
  if (structured?.type === "component") {
    const custom_content: ChatMessage["custom_content"] = [
      {
        type: "text",
        text: "📊 Dưới đây là thông tin bạn yêu cầu:",
        style: "default"
      },
      {
        type: "component",
        name: structured.name as AllowedComponents,
        layout: structured.layout || "block",
        props: structured.props || {}
      }
    ]
    return custom_content
  }
  return undefined
}


export default function ChatAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [confirmedIds, setConfirmedIds] = useState<string[]>([])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: MessageRole.USER,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // 🔍 Phân loại
      const classify = await axiosInstance.post("/ai/chat", { message })
      const intent = classify.data.intent
      let apiRes
      let custom_content: ChatMessage["custom_content"] | undefined = undefined
      if (intent === "transaction") {
        apiRes = await axiosInstance.post("/ai/chat/transaction", { message })
      } else if (intent === "component") {
        apiRes = await axiosInstance.post("/ai/chat/component", { message })
      } else {
        throw new Error("Không hiểu yêu cầu.")
      }

      const structured = apiRes.data.structured
      custom_content = convertStructuredToCustomContent(structured)
      console.log("👉 intent:", intent)
      console.log("👉 structured:", apiRes.data.structured)


      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: apiRes.data.raw,
        structured,
        custom_content,
        user_input: message,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

    } catch (err) {
      console.error("❌ Lỗi khi gửi:", err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: "⚠️ Lỗi hoặc không hiểu yêu cầu.",
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
      await axiosInstance.post("/ai/confirm", {
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: null,
        confirmed: true,
      })

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "✅ Giao dịch đã được lưu vào hệ thống.",
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, successMessage])
      setConfirmedIds((prev) => [...prev, message.id])

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

  // Lấy lịch sử từ localStorage
  useEffect(() => {
    const stored = localStorage.getItem("chatHistory")
    if (stored) {
      const { date, messages: savedMessages } = JSON.parse(stored)
      const today = new Date().toDateString()
      if (date === today) {
        const restoredMessages = savedMessages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        setMessages(restoredMessages)
        return
      }
    }

    // Nếu không có hoặc quá hạn → tạo tin nhắn chào
    setMessages([
      {
        id: "1",
        content: "Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...",
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      },
    ])
  }, [])

  // Gửi tin nhắn pending từ localStorage
  useEffect(() => {
    const pending = localStorage.getItem("pendingChatMessage")
    if (pending) {
      localStorage.removeItem("pendingChatMessage")
      setTimeout(() => {
        handleSendMessage(pending)
      }, 300)
    }
  }, [])

  // Cho phép gọi từ ngoài (global function)
  useEffect(() => {
    ;(window as any).sendChatMessage = handleSendMessage
    ;(window as any).setInputValue = setInputValue
    ;(window as any).inputValue = inputValue
  }, [inputValue])

  // Lưu vào localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("chatHistory", JSON.stringify({
        date: new Date().toDateString(),
        messages
      }))
    }
  }, [messages])

  // Tự cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)
    return () => clearTimeout(timeout)
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onConfirm={() => handleConfirm(message)}
            isConfirmed={confirmedIds.includes(message.id)}
            confirmedIds={confirmedIds}
          />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Hành động nhanh */}
      <QuickActions onAction={handleQuickAction} />
    </div>
  )
}
