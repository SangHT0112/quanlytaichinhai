"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MessageItem } from "@/components/MessageItem";
import QuickActions from "@/components/QuickActions";
import { ChatMessage, MessageRole } from "@/components/types";
import axiosInstance from "@/config/axios";
import { AllowedComponents } from "@/components/types";
import { saveChatHistory } from "@/api/chatHistoryApi";

// Helper: Convert structured → custom_content
function convertStructuredToCustomContent(structured: any): ChatMessage["custom_content"] | undefined {
  if (structured?.type === "component") {
    return [
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
    ];
  }
  return undefined;
}

export default function ChatAI() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isApiProcessing = useRef(false); // Sử dụng ref để kiểm soát gọi API

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  const currentUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "null")
    : null;

  const getWelcomeMessage = (): ChatMessage => ({
    id: "1",
    content: "Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...",
    role: MessageRole.ASSISTANT,
    timestamp: new Date(),
  });

  const sendToApi = async (message: string, updatedMessages: ChatMessage[]) => {
    if (isApiProcessing.current) return; // Ngăn chặn gọi API lặp lại
    isApiProcessing.current = true;

    try {
      const conversationHistory = updatedMessages.slice(-5).map((msg) => ({
        role: msg.role,
        content: msg.content,
        structured: msg.structured ?? null,
      }));

      const res = await axiosInstance.post("/ai/chat", {
        message,
        history: conversationHistory,
        user_id: currentUser?.user_id,
      });

      const { intent, structured, raw } = res.data;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: raw || "⚠️ Không nhận được phản hồi từ AI.",
        structured,
        custom_content: intent === "component" ? convertStructuredToCustomContent(structured) : undefined,
        user_input: message,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        intent,
      };
      console.log("AI PHAN HOI:", aiMessage)

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("❌ API error:", err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: `⚠️ Lỗi: ${err.message || "Không thể xử lý yêu cầu."}`,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      isApiProcessing.current = false; // Đặt lại cờ sau khi hoàn thành
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: MessageRole.USER,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      sendToApi(message, newMessages);
      return newMessages;
    });

    setInputValue("");
    setIsLoading(true);
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleConfirm = async (message: ChatMessage) => {
    try {
      await axiosInstance.post("/ai/confirm", {
        user_id: currentUser?.user_id || 1,
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: null,
        confirmed: true,
      });

      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        content: "✅ Giao dịch đã được lưu vào hệ thống.",
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, confirmMsg]);
      setConfirmedIds((prev) => [...prev, message.id]);
    } catch (err) {
      console.error("❌ Xác nhận lỗi:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "❌ Lỗi khi xác nhận giao dịch.",
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Check login và load lịch sử chat
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
      return;
    }

    const stored = localStorage.getItem("chatHistory");
    const today = new Date().toDateString();

    if (stored) {
      try {
        const { date, messages: savedMessages } = JSON.parse(stored);
        if (date === today) {
          const restored = savedMessages.map((m: any) => ({
            ...m,
            role: m.role ?? MessageRole.USER,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(restored);
          return;
        }
      } catch (e) {
        console.warn("⚠️ Lỗi khi đọc lịch sử:", e);
      }
    }
    setMessages([getWelcomeMessage()]);
  }, []);

  // Tự động scroll xuống cuối
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Lưu vào DB (1 tin nhắn cuối)
  useEffect(() => {
    if (messages.length > 1 && currentUser?.user_id) {
      const save = async () => {
        try {
          const last = messages[messages.length - 1];
          await saveChatHistory(currentUser.user_id, [
            {
              ...last,
              timestamp: last.timestamp.toISOString(),
            },
          ]);
        } catch (err) {
          console.error("❌ Không thể lưu DB:", err);
        }
      };
      save();
    }
  }, [messages, currentUser?.user_id]);

  // Gán global
  useEffect(() => {
    (window as any).sendChatMessage = handleSendMessage;
    (window as any).setInputValue = setInputValue;
    (window as any).inputValue = inputValue;
  }, [inputValue]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onConfirm={() => handleConfirm(msg)}
            isConfirmed={confirmedIds.includes(msg.id)}
            confirmedIds={confirmedIds}
          />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <QuickActions onAction={handleQuickAction} />
    </div>
  );
}