'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { MessageItem } from '@/components/MessageItem';
import QuickActions from '@/components/QuickActions';
import { ChatMessage, MessageRole, StructuredData, TransactionData } from '@/utils/types';
import axiosInstance from '@/config/axios';
import { saveChatHistory, getChatHistory } from '@/api/chatHistoryApi';
import { useTransaction } from '@/contexts/TransactionContext';
import { convertStructuredToCustomContent } from '@/utils/convertStructured';
import { FinancialSummary } from "@/types/financial";
import { fetchOverview } from '@/api/overviewApi';
import ErrorBoundary from '@/components/ErrorBoundary';
// Helper để lấy ngày hôm nay dạng YYYY-MM-DD
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // => "2025-09-01"
};

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
  const [error, setError] = useState<string | null>(null);

  const currentUser = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null;
  const { refreshTransactionGroups } = useTransaction();

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
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error('Lỗi parse structured data:', e, { data });
        return false;
      }
    }
    if (parsedData && typeof parsedData === 'object' && 'message' in parsedData && !('type' in parsedData)) {
      return false;
    }
    return !('type' in parsedData) || parsedData.type !== 'component';
  };

  const sendToApi = useCallback(async (message: string, updatedMessages: ChatMessage[], imageData?: FormData) => {
    if (isApiProcessing.current) return;
    isApiProcessing.current = true;

    try {
      let aiMessage: ChatMessage;
      if (imageData) {
        console.log('Gửi yêu cầu xử lý tài liệu đến API:');
        try {
          await fetch('https://quanlytaichinhai-python.onrender.com/ping');
          await new Promise((resolve) => setTimeout(resolve, 3000));
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
          id: uuidv4(),
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
          id: uuidv4(),
          content: raw || '⚠️ Không nhận được phản hồi từ AI.',
          structured,
          custom_content: intent === 'component' ? convertStructuredToCustomContent(structured) : undefined,
          user_input: message,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
          intent,
        };
      }

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        saveChatHistory(currentUser.user_id, [aiMessage]).then((success) => {
          console.log('Save chat history result:', success);
          if (!success) {
            setError('Lỗi khi lưu tin nhắn vào cơ sở dữ liệu.');
          }
        });
        return newMessages;
      });
    } catch (err: unknown) {
      console.error('❌ API error:', err instanceof Error ? err.message : 'Unknown error');
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        content: `⚠️ Lỗi: ${err instanceof Error ? err.message : 'Không thể xử lý yêu cầu.'}`,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };
      
      setMessages((prev) => {
        const newMessages = [...prev, errorMsg];
        saveChatHistory(currentUser.user_id, [errorMsg]).then((success) => {
          console.log('Save error message result:', success);
          if (!success) {
            setError('Lỗi khi lưu tin nhắn lỗi vào cơ sở dữ liệu.');
          }
        });
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      isApiProcessing.current = false;
    }
  }, [currentUser?.user_id]);

  const handleSendMessage = useCallback(async (message: string, imageData?: FormData) => {
    if (!message.trim() && !imageData) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: message || (imageData ? 'Đã gửi hình ảnh' : ''),
      role: MessageRole.USER,
      timestamp: new Date(),
      imageUrl: imageData ? URL.createObjectURL(imageData.get('image') as File) : undefined,
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      saveChatHistory(currentUser.user_id, [userMessage]);
      return newMessages;
    });

    setInputValue('');
    setIsLoading(true);

    await sendToApi(message, [...messages, userMessage], imageData);
  }, [sendToApi, currentUser?.user_id, messages]);

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

      setConfirmedIds((prev) => {
        const newConfirmedIds = [...prev, message.id];
        localStorage.setItem('confirmedIds', JSON.stringify({
          user_id: currentUser?.user_id || 1,
          ids: newConfirmedIds,
          expiry: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        }));
        return newConfirmedIds;
      });

      const financialSummary: FinancialSummary = await fetchOverview(currentUser?.user_id || 1);

      const confirmMsg: ChatMessage = {
        id: uuidv4(),
        content: correctedData
          ? `✅ Giao dịch đã được lưu vào hệ thống. Số dư hiện tại: ${financialSummary.actual_balance.toLocaleString('vi-VN')} VND`
          : `✅ Danh mục đã được xác nhận.`,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, confirmMsg];
        saveChatHistory(currentUser.user_id, [confirmMsg]).then((success) => {
          console.log('Save confirm message result:', success);
          if (!success) {
            setError('Lỗi khi lưu tin nhắn xác nhận vào cơ sở dữ liệu.');
          }
        });
        return newMessages;
      });

      await refreshTransactionGroups();
    } catch (err: unknown) {
      console.error('❌ Xác nhận lỗi:', err instanceof Error ? err.message : 'Unknown error');
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        content: '❌ Lỗi khi xác nhận.',
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, errorMsg];
        saveChatHistory(currentUser.user_id, [errorMsg]).then((success) => {
          console.log('Save error message result:', success);
          if (!success) {
            setError('Lỗi khi lưu tin nhắn lỗi vào cơ sở dữ liệu.');
          }
        });
        return newMessages;
      });
    }
  };

  const handleSaveEdit = async (messageId: string, editedData: TransactionData, editingIndex: number) => {
    console.log('SAVE EDIT PAYLOAD:', {
      messageId,
      editedData,
      user_id: currentUser?.user_id || 1,
    });

    try {
      setMessages((prev) => {
        const newMessages = prev.map((msg) =>
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
        );
        saveChatHistory(currentUser.user_id, newMessages.filter((msg) => msg.id === messageId)).then((success) => {
          console.log('Save edited message result:', success);
          if (!success) {
            setError('Lỗi khi lưu tin nhắn đã chỉnh sửa vào cơ sở dữ liệu.');
          }
        });
        return newMessages;
      });
    } catch (err: unknown) {
      console.error('❌ Lỗi khi lưu chỉnh sửa:', err instanceof Error ? err.message : 'Unknown error');
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        content: '❌ Lỗi khi cập nhật giao dịch.',
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, errorMsg];
        saveChatHistory(currentUser.user_id, [errorMsg]).then((success) => {
          console.log('Save error message result:', success);
          if (!success) {
            setError('Lỗi khi lưu tin nhắn lỗi vào cơ sở dữ liệu.');
          }
        });
        return newMessages;
      });
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      console.warn('No user found in localStorage, redirecting to login');
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const today = new Date().toISOString().split("T")[0];
        console.log("Fetching chat history for today:", { userId: currentUser?.user_id, date: today });

        const history = await getChatHistory(currentUser?.user_id, 50, today);

        console.log("Fetched history:", history);

        const uniqueHistory: ChatMessage[] = Array.from(
          new Map(
            history.map((msg: ChatMessage) => [
              msg.id,
              {
                ...msg,
                role: msg.role ?? MessageRole.USER,
                timestamp: msg.timestamp,
              },
            ])
          ).values()
        );

        setMessages(uniqueHistory);

      } catch (err) {
        console.error("⚠️ Lỗi khi lấy lịch sử chat:", err);
        setError("Lỗi khi tải lịch sử chat. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };


    if (currentUser?.user_id) {
      fetchHistory();
    }
  }, [router, currentUser?.user_id]);


  // Load confirmedIds and custom background
  useEffect(() => {
    const savedConfirmedIds = localStorage.getItem('confirmedIds');
    if (savedConfirmedIds) {
      try {
        const parsed = JSON.parse(savedConfirmedIds);
        if (parsed.user_id === currentUser?.user_id && new Date(parsed.expiry) > new Date()) {
          setConfirmedIds(parsed.ids);
        } else {
          localStorage.removeItem('confirmedIds');
        }
      } catch (e) {
        console.warn('⚠️ Lỗi khi đọc confirmedIds:', e);
        localStorage.removeItem('confirmedIds');
      }
    }

    const savedBg = localStorage.getItem('custom_background');
    if (savedBg) {
      document.body.style.backgroundImage = `url('${savedBg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [currentUser?.user_id]);

  // Global window functions
  useEffect(() => {
    const extendedWindow = window as unknown as ExtendedWindow;
    extendedWindow.sendChatMessage = handleSendMessage;
    extendedWindow.setInputValue = setInputValue;
    extendedWindow.inputValue = inputValue;
  }, [handleSendMessage, setInputValue, inputValue]);

  const hasMessages = messages.length > 0;
  useEffect(() => {
    window.hasMessages = hasMessages;
  }, [hasMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-cover bg-center pb-20 md:pb-0">
      <div
        className={`flex-1 overflow-y-auto space-y-4 sm:px-16 message-container ${
          !hasMessages ? 'flex flex-col justify-center items-center' : ''
        }`}
      >
        <div className="mt-3">
          {error && <div className="text-red-500 text-center">{error}</div>}
          <ErrorBoundary>
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onConfirm={handleConfirm}
                confirmedIds={confirmedIds}
                onSaveEdit={handleSaveEdit}
              />
            ))}
          </ErrorBoundary>
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!hasMessages ? (
        <div className="fixed inset-0 flex justify-center items-center pointer-events-none">
          <div className="flex flex-col items-center w-full max-w-3xl px-4 pointer-events-auto space-y-6">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-4 leading-tight drop-shadow-lg">
                Quản Lý Tài Chính AI
              </h1>
              <p className="text-xl text-slate-200 mb-6 leading-relaxed max-w-2xl mx-auto">
                Hệ thống quản lý tài chính thông minh với trí tuệ nhân tạo
              </p>
            </div>
            {/* <ChatInput
              isSidebarOpen={false}
              isSidebarRightOpen={false}
              pathname="/chat"
              centered={true}
            /> */}
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
              {/* <ChatInput
                isSidebarOpen={false}
                isSidebarRightOpen={false}
                pathname="/chat"
                centered={false}
              /> */}
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