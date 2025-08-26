'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { MessageItem } from '@/components/MessageItem';
import QuickActions from '@/components/QuickActions';
import { ChatMessage, MessageRole, StructuredData, TransactionData } from '@/utils/types';
import axiosInstance from '@/config/axios';
import { saveChatHistory } from '@/api/chatHistoryApi';
import { useCallback } from 'react';
import { useTransaction } from '@/contexts/TransactionContext';
import { convertStructuredToCustomContent } from '@/utils/convertStructured';
import { FinancialSummary } from "@/types/financial"
import { fetchOverview } from '@/api/overviewApi';
import { ChatInput } from '@/components/Layouts/ChatInput';
// Extend Window interface
interface ExtendedWindow extends Window {
  sendChatMessage: (message: string, imageData?: FormData) => void;
  setInputValue: (value: string) => void;
  inputValue: string;
}
declare global {
  interface Window {
    hasMessages: boolean;
  }
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
  const isTransactionStructuredData = (
    data: StructuredData,
  ): data is {
    transactions?: Array<{
      type: 'expense' | 'income';
      category: string;
      amount: number;
      user_id?: number;
      date?: string;
      transaction_date?: string;
      description?: string;
    }>;
    group_name?: string;
    total_amount?: number;
    transaction_date?: string;
  } => {
    return !('type' in data) || data.type !== 'component';
  };
  const { refreshTransactionGroups } = useTransaction();

  // const getWelcomeMessage = (): ChatMessage => ({
  //   id: '1',
  //   content: 'Xin chào! Tôi là AI hỗ trợ tài chính. Hãy hỏi tôi về: số dư, chi tiêu, tiết kiệm...',
  //   role: MessageRole.ASSISTANT,
  //   timestamp: new Date(),
  // });

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
  }, [setMessages, setIsLoading, currentUser?.user_id]);

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
      // Send confirmation request to API
      await axiosInstance.post('/ai/confirm', {
        user_id: currentUser?.user_id || 1,
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: correctedData || null,
        confirmed: true,
      });

      // Cập nhật confirmedIds cho cả danh mục và giao dịch
      setConfirmedIds((prev) => {
        const newConfirmedIds = [...prev, message.id];
        // Save confirmedIds to localStorage
        localStorage.setItem('confirmedIds', JSON.stringify({
          user_id: currentUser?.user_id || 1,
          ids: newConfirmedIds,
          expiry: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        }));
        return newConfirmedIds;
      });

      // Fetch the latest financial overview to get the current balance
      const financialSummary: FinancialSummary = await fetchOverview(currentUser?.user_id || 1);

      // Create confirmation message
      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        content: correctedData
          ? `✅ Giao dịch đã được lưu vào hệ thống. Số dư hiện tại: ${financialSummary.actual_balance.toLocaleString('vi-VN')} VND`
          : `✅ Danh mục đã được xác nhận.`,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };

      await refreshTransactionGroups();
      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err: unknown) {
      console.error('❌ Xác nhận lỗi:', err instanceof Error ? err.message : 'Unknown error');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: '❌ Lỗi khi xác nhận.',
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSaveEdit = async (messageId: string, editedData: TransactionData, editingIndex: number) => {
    console.log('SAVE EDIT PAYLOAD:', {
      messageId,
      editedData,
      user_id: currentUser?.user_id || 1,
    });

    try {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId &&
          msg.structured &&
          isTransactionStructuredData(msg.structured) &&
          Array.isArray(msg.structured.transactions)
            ? {
                ...msg,
                structured: {
                  ...msg.structured,
                  transactions: msg.structured.transactions.map((tx, index) =>
                    index === editingIndex ? editedData : tx
                  ),
                },
                content: 'Giao dịch đã được chỉnh sửa, vui lòng xác nhận.',
              }
            : msg
        )
      );
    } catch (err: unknown) {
      console.error('❌ Lỗi khi lưu chỉnh sửa:', err instanceof Error ? err.message : 'Unknown error');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: '❌ Lỗi khi cập nhật giao dịch.',
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Check login và load lịch sử chat từ localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const storedChat = localStorage.getItem('chatHistory');
    if (storedChat) {
      try {
        const { date, messages: savedMessages } = JSON.parse(storedChat);
        const today = new Date().toDateString();

        if (date === today) {
          // Khôi phục tin nhắn cũ trong ngày
          const restored = savedMessages.map((m: Partial<ChatMessage>) => ({
            ...m,
            role: m.role ?? MessageRole.USER,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setMessages(restored);
        } else {
          // Ngày mới -> xóa lịch sử cũ
          localStorage.removeItem('chatHistory');
        }
      } catch (e) {
        console.warn('⚠️ Lỗi khi đọc lịch sử:', e);
        localStorage.removeItem('chatHistory');
      }
    }
  }, [router, currentUser?.user_id]);

    

  // Lưu tin nhắn vào localStorage với thời hạn 24 giờ
  // Lưu tin nhắn vào localStorage theo ngày
  useEffect(() => {
    if (messages.length > 0) {
      const today = new Date().toDateString(); // vd: "Tue Aug 26 2025"
      const chatHistory = {
        date: today,
        messages: messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      };
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [messages]);


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

  useEffect(() => {
    const savedBg = localStorage.getItem('custom_background');
    if (savedBg) {
      document.body.style.backgroundImage = `url('${savedBg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, []);

  // Kiểm tra xem có chỉ có tin nhắn chào mừng hay không
  const hasMessages = messages.length > 0;
   useEffect(() => {
      window.hasMessages = hasMessages;
    }, [hasMessages]);


  return (
    <div className="flex flex-col h-full bg-cover bg-center pb-20 md:pb-0">
      <div className={`flex-1 overflow-y-auto space-y-4 pb-40 sm:px-16 message-container ${!hasMessages ? 'flex flex-col justify-center items-center' : ''}`}>
        {!hasMessages && (
          <div className="text-center mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-4 leading-tight drop-shadow-lg">
                Quản Lý Tài Chính AI
              </h1>

              <p className="text-xl text-slate-200 mb-6 leading-relaxed max-w-2xl mx-auto">
                Hệ thống quản lý tài chính thông minh với trí tuệ nhân tạo
              </p>
            </div>

            {/* Placeholder content */}
            
          </div>
        )}
         <div className="mt-3">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onConfirm={handleConfirm}
                confirmedIds={confirmedIds}
                onSaveEdit={handleSaveEdit}
              />
            ))}
            {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
       
      </div>
      
      {/* Nếu có tin nhắn → ChatInput fixed dưới, nếu chưa có thì ở giữa */}
    {!hasMessages ? (
      <div className="fixed inset-0 flex justify-center items-center">
        <div className="flex flex-col items-center w-full max-w-3xl px-4">
          <ChatInput
            isSidebarOpen={false}
            isSidebarRightOpen={false}
            pathname="/chat"
            centered={true}
          />
          <div className="mt-6">
            <QuickActions
              userId={currentUser?.user_id || 1}
              onAction={handleQuickAction}
            />
          </div>
        </div>
      </div>
    ) : (
      <>
        <div className="z-50 px-4 fixed bottom-0 left-0 right-0 pb-4 bg-transparent">
          <div className="w-full max-w-3xl mx-auto">
            <ChatInput
              isSidebarOpen={false}
              isSidebarRightOpen={false}
              pathname="/chat"
              centered={false}
            />
          </div>
        </div>
        <div className="mb-20">
          <QuickActions
            userId={currentUser?.user_id || 1}
            onAction={handleQuickAction}
          />
        </div>
      </>
    )}


    </div>
  );
}