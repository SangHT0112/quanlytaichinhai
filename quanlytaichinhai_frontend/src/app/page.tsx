'use client';
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
        text: structured.introText || "Thông tin từ AI",
        style: "default",
      },
      {
        type: "component",
        name: structured.name as AllowedComponents,
        layout: structured.layout || "block",
        props: structured.props || {},
      },
    ];
  }
  return undefined;
}

export default function ChatAI() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isApiProcessing = useRef(false);

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

 const sendToApi = async (message: string, updatedMessages: ChatMessage[], imageData?: FormData) => {
  if (isApiProcessing.current) return;
  isApiProcessing.current = true;

  try {
    let aiMessage: ChatMessage;
    if (imageData) {
      // Gửi yêu cầu đến endpoint xử lý tài liệu
      console.log("Gửi yêu cầu xử lý tài liệu đến API:");
      for (const [key, value] of imageData.entries()) {
        console.log(`${key}:`, value instanceof File ? value.name : value);
      }
      const res = await axiosInstance.post("/ai/process-document", imageData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Phản hồi từ API xử lý tài liệu:", res.data);
      const { raw, imageUrl, structured, intent } = res.data;

      aiMessage = {
        id: (Date.now() + 1).toString(),
        content: raw || "Đã xử lý tài liệu.",
        structured, // Kết quả từ LayoutLMv3
        imageUrl, // URL hình ảnh từ server
        custom_content: intent === "component" ? convertStructuredToCustomContent(structured) : undefined,
        user_input: message,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        intent: intent || "document", // Intent mặc định cho tài liệu
      };
    } else {
      // Xử lý văn bản như trước
      console.log("Gửi yêu cầu văn bản đến API:", { message });
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

      console.log("Phản hồi từ API văn bản:", res.data);
      const { intent, structured, raw } = res.data;

      aiMessage = {
        id: (Date.now() + 1).toString(),
        content: raw || "⚠️ Không nhận được phản hồi từ AI.",
        structured,
        custom_content: intent === "component" ? convertStructuredToCustomContent(structured) : undefined,
        user_input: message,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        intent,
      };
    }

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
    isApiProcessing.current = false;
  }
};

  const handleSendMessage = async (message: string, imageData?: FormData) => {
    if (!message.trim() && !imageData) return;
  //   if (imageData) {
    // console.log("Nhận từ ChatInput:", { message });
  //   console.log("Nội dung FormData:");
  //   for (const [key, value] of imageData.entries()) {
  //     console.log(`${key}:`, value instanceof File ? value.name : value);
  //   }
  // } else {
  //   console.log("Nhận từ ChatInput:", { message, imageData });
  // }
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message || (imageData ? "Đã gửi hình ảnh" : ""),
      role: MessageRole.USER,
      timestamp: new Date(),
      imageUrl: imageData ? URL.createObjectURL((imageData.get("image") as File)) : undefined, // Xem trước ảnh phía client
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      sendToApi(message, newMessages, imageData);
      return newMessages;
    });

    setInputValue("");
    setIsLoading(true);
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleConfirm = async (message: ChatMessage, correctedData?: any) => {
    console.log("CONFIRM PAYLOAD:", {
      user_id: currentUser?.user_id || 1,
      user_input: message.user_input || message.content,
      ai_suggested: message.structured,
      user_corrected: correctedData || null,
      confirmed: true,
    });

    try {
      await axiosInstance.post("/ai/confirm", {
        user_id: currentUser?.user_id || 1,
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: correctedData || null,
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
            onConfirm={(message, correctedData) => handleConfirm(message, correctedData)}
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