'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { MessageItem } from '@/components/MessageItem';
import QuickActions from '@/components/QuickActions';
import { ChatMessage, MessageRole, StructuredData, TransactionData } from '@/components/types';
import axiosInstance from '@/config/axios';
import { saveChatHistory } from '@/api/chatHistoryApi';
import { useCallback } from 'react';
import { AllowedComponents } from '@/components/types';
import { useTransaction } from '@/contexts/TransactionContext';

// Helper: Type guard để kiểm tra StructuredData dạng component
const isComponentStructuredData = (data: StructuredData): data is { type: 'component'; name: AllowedComponents; introText?: string; props?: Record<string, unknown>; layout?: 'inline' | 'block' } => {
  return 'type' in data && data.type === 'component';
};
// Helper: Convert structured → custom_content
function convertStructuredToCustomContent(structured: StructuredData): ChatMessage['custom_content'] | undefined {
  if (isComponentStructuredData(structured)) {
    return [
      {
        type: 'text',
        text: structured.introText || 'Thông tin từ AI',
        style: 'default',
      },
      {
        type: 'component',
        name: structured.name,
        layout: structured.layout || 'block',
        props: structured.props || {},
      },
    ];
  } else if ('transactions' in structured && structured.transactions) {
    return [
      {
        type: 'text',
        text: structured.group_name || 'Thông tin giao dịch từ AI',
        style: 'default',
      },
      {
        type: 'component',
        name: 'TransactionConfirmationForm',
        layout: 'block',
        props: {
          transactionData: structured.transactions,
          transactionType: structured.transactions[0]?.type || 'expense',
        },
      },
    ];
  }
  return undefined;
}

// Extend Window interface
interface ExtendedWindow extends Window {
  sendChatMessage: (message: string, imageData?: FormData) => void;
  setInputValue: (value: string) => void;
  inputValue: string;
}

export default function ChatAI() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isApiProcessing = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  const currentUser = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null;

  const { refreshTransactions } = useTransaction();

  const getWelcomeMessage = (): ChatMessage => ({
    id: '1',
    content: 'Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...',
    role: MessageRole.ASSISTANT,
    timestamp: new Date(),
  });

  const sendToApi = useCallback(async (message: string, updatedMessages: ChatMessage[], imageData?: FormData) => {
    if (isApiProcessing.current) return;
    isApiProcessing.current = true;

    try {
      let aiMessage: ChatMessage;
      if (imageData) {
        console.log('Gửi yêu cầu xử lý tài liệu đến API:');

        try {
          await fetch('https://quanlytaichinhai-python.onrender.com/ping');
          await new Promise((resolve) => setTimeout(resolve, 3000)); // đợi 3s cho chắc
        } catch (err) {
          console.warn("Không thể ping backend Python:", err);
        }

        for (const [key, value] of imageData.entries()) {
          console.log(`${key}:`, value instanceof File ? value.name : value);
        }
        const res = await axiosInstance.post('/ai/process-document', imageData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('Phản hồi từ API xử lý tài liệu:', res.data);
        const { raw, imageUrl, structured, intent } = res.data;

        aiMessage = {
          id: (Date.now() + 1).toString(),
          content: raw || 'Đã xử lý tài liệu.',
          structured,
          imageUrl,
          custom_content: intent === 'component' ? convertStructuredToCustomContent(structured) : undefined,
          user_input: message,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
          intent: intent || 'document',
        };
      } else {
        console.log('Gửi yêu cầu văn bản đến API:', { message });
        const conversationHistory = updatedMessages.slice(-5).map((msg) => ({
          role: msg.role,
          content: msg.content,
          structured: msg.structured ?? null,
        }));

        const res = await axiosInstance.post('/ai/chat', {
          message,
          history: conversationHistory,
          user_id: currentUser?.user_id,
        });

        console.log('Phản hồi từ API văn bản:', res.data);
        const { intent, structured, raw } = res.data;

        aiMessage = {
          id: (Date.now() + 1).toString(),
          content: raw || '⚠️ Không nhận được phản hồi từ AI.',
          structured,
          custom_content: intent === 'component' ? convertStructuredToCustomContent(structured) : undefined,
          user_input: message,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
          intent,
        };
      }

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('❌ API error:', err instanceof Error ? err.message : 'Unknown error');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: `⚠️ Lỗi: ${err instanceof Error ? err.message : 'Không thể xử lý yêu cầu.'}`,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      isApiProcessing.current = false;
    }
  }, [setMessages, setIsLoading, currentUser?.user_id]); // Removed convertStructuredToCustomContent

  const handleSendMessage = useCallback(async (message: string, imageData?: FormData) => {
    if (!message.trim() && !imageData) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message || (imageData ? 'Đã gửi hình ảnh' : ''),
      role: MessageRole.USER,
      timestamp: new Date(),
      imageUrl: imageData ? URL.createObjectURL(imageData.get('image') as File) : undefined,
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      sendToApi(message, newMessages, imageData);
      return newMessages;
    });

    setInputValue('');
    setIsLoading(true);
  }, [setMessages, setInputValue, setIsLoading, sendToApi]);

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleConfirm = async (message: ChatMessage, correctedData?: TransactionData | TransactionData[]) => {
    console.log('CONFIRM PAYLOAD:', {
      user_id: currentUser?.user_id || 1,
      user_input: message.user_input || message.content,
      ai_suggested: message.structured,
      user_corrected: correctedData || null,
      confirmed: true,
    });

    try {
      await axiosInstance.post('/ai/confirm', {
        user_id: currentUser?.user_id || 1,
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: correctedData || null,
        confirmed: true,
      });

      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        content: '✅ Giao dịch đã được lưu vào hệ thống.',
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };
      await refreshTransactions();
      setMessages((prev) => [...prev, confirmMsg]);
      setConfirmedIds((prev) => [...prev, message.id]);
    } catch (err: unknown) {
      console.error('❌ Xác nhận lỗi:', err instanceof Error ? err.message : 'Unknown error');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: '❌ Lỗi khi xác nhận giao dịch.',
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Check login và load lịch sử chat
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const stored = localStorage.getItem('chatHistory');
    const today = new Date().toDateString();

    if (stored) {
      try {
        const { date, messages: savedMessages } = JSON.parse(stored);
        if (date === today) {
          const restored = savedMessages.map((m: Partial<ChatMessage>) => ({
            ...m,
            role: m.role ?? MessageRole.USER,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setMessages(restored);
          return;
        }
      } catch (e) {
        console.warn('⚠️ Lỗi khi đọc lịch sử:', e);
      }
    }
    setMessages([getWelcomeMessage()]);
  }, [router]);

  // Tự động scroll xuống cuối
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Lưu vào DB (1 tin nhắn cuối)
  useEffect(() => {
    if (messages.length > 0 && currentUser?.user_id) {
      const save = async () => {
        try {
          const last = messages[messages.length - 1];
          const messageToSave: ChatMessage = {
            ...last,
            timestamp: last.timestamp instanceof Date ? last.timestamp : new Date(last.timestamp),
          };
          await saveChatHistory(currentUser.user_id, [messageToSave]);
        } catch (err) {
          console.error('❌ Không thể lưu DB:', err);
        }
      };
      save();
    }
  }, [messages, currentUser?.user_id]);

  // Gán global
  useEffect(() => {
    const extendedWindow = window as unknown as ExtendedWindow;
    extendedWindow.sendChatMessage = handleSendMessage;
    extendedWindow.setInputValue = setInputValue;
    extendedWindow.inputValue = inputValue;
  }, [handleSendMessage, setInputValue, inputValue]);

  return (
    <div className="flex flex-col h-full bg-cover bg-center pb-20">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 mt-3 mx-55">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onConfirm={(message, correctedData) => handleConfirm(message, correctedData)}
            confirmedIds={confirmedIds}
          />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <QuickActions userId={currentUser?.user_id || 1} onAction={handleQuickAction} />
    </div>
  );
}