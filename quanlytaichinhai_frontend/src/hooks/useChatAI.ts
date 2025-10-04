import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, TransactionData } from '@/utils/types';
import { FinancialSummary } from "@/types/financial";
import axiosInstance from '@/config/axios';
import { saveChatHistory, getChatHistory } from '@/api/chatHistoryApi';
import { useTransaction } from '@/contexts/TransactionContext';
import { fetchOverview } from '@/api/overviewApi';
import { MessageRole } from '@/utils/types';
import { isConfirmPriorityStructured, isSuggestNewCategoryStructured, isTransactionStructuredData } from '@/utils/typeGuards';
export const useChatAI = () => {
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

  // Các helper functions và type guards


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

  const handleConfirm = async (message: ChatMessage, correctedData?: TransactionData | TransactionData[]): Promise<void> => {
    console.log('CONFIRM PAYLOAD:', {
        user_id: currentUser?.user_id || 1,
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: correctedData || null,
        confirmed: true,
    });

    try {
        // Kiểm tra xác nhận ưu tiên bằng type guard
        if (isConfirmPriorityStructured(message.structured)) {
        console.log('Xử lý xác nhận ưu tiên');
        
        // Bây giờ TypeScript biết message.structured là { response_type: 'confirm_priority' }
        const selectedPriority = message.structured.temp_plans?.[0]?.priority || 'medium';
        
        const response = await axiosInstance.post('/ai/confirm-priority', {
            user_id: currentUser?.user_id || 1,
            selected_priority: selectedPriority,
            temp_plans: message.structured.temp_plans,
        });

        if (!response.data.success) {
            throw new Error('Lỗi khi xác nhận ưu tiên');
        }

        setConfirmedIds((prev) => {
            const newConfirmedIds = [...prev, message.id];
            localStorage.setItem('confirmedIds', JSON.stringify({
            user_id: currentUser?.user_id || 1,
            ids: newConfirmedIds,
            expiry: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            }));
            return newConfirmedIds;
        });

        const confirmMsg: ChatMessage = {
            id: uuidv4(),
            content: `✅ Kế hoạch đã được xác nhận với mức ưu tiên: ${selectedPriority}.`,
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

        // Chuyển hướng nếu có redirectPath
        if (response.data.redirectPath) {
            router.push(response.data.redirectPath);
        }

        return;
        }

        if (isSuggestNewCategoryStructured(message.structured)) {
        console.log('Xử lý xác nhận suggest_new_category');

        // Lấy dữ liệu transaction tạm
        const temp = message.structured.temporary_transaction;
        const ai_suggested = {
            group_name: temp?.group_name,
            transaction_date: temp?.transaction_date,
            user_id: temp?.user_id,
            transactions: temp?.transactions,
        };

        // Gửi về backend
        await axiosInstance.post('/ai/confirm', {
            user_id: currentUser?.user_id || 1,
            user_input: message.user_input || message.content,
            ai_suggested, // CHÚ Ý: dùng temporary_transaction thay vì cả structured
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
            : `✅ Danh mục mới '${message.structured.suggest_new_category.name}' đã được xác nhận.`,
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
        return;
        }


        // Xử lý xác nhận giao dịch
        if (message.structured && isTransactionStructuredData(message.structured)) {
        console.log('Xử lý xác nhận giao dịch');
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
        } else {
        console.warn('Dữ liệu structured không hợp lệ:', message.structured);
        throw new Error('Dữ liệu không hợp lệ để xác nhận');
        }
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


  const handleSaveEdit = async (messageId: string, editedData: TransactionData, editingIndex: number): Promise<void> => {
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
    const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  // Effects
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
        const history = await getChatHistory(currentUser?.user_id, 50, today);

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
  }, [currentUser?.user_id]);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    confirmedIds,
    error,
    messagesEndRef,
    handleSendMessage,
    handleConfirm,
    handleSaveEdit,
    handleQuickAction,
    currentUser,
  };

}