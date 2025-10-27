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
import { isSuggestNewCategoryStructured, isTransactionStructuredData } from '@/utils/typeGuards';
import { Socket } from 'socket.io-client'; // Thêm import cho Socket
import { toast } from 'react-toastify';

// Define interface for socket message data to avoid 'any'
interface SocketMessageData {
  id?: string;
  content: string;
  role: MessageRole;
  timestamp?: string;
  structured?: unknown;
  intent?: string;
  imageUrl?: string;
  user_input?: string;
}

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

  // Thêm state cho socket
  const [socket, setSocket] = useState<Socket | null>(null);

  // Hàm để initialize socket từ component (gọi từ ChatAI)
  const initializeSocket = useCallback((sock: Socket) => {
    setSocket(sock);
  }, []);

  // Lắng nghe receive_message để đồng bộ tin nhắn real-time
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: SocketMessageData) => {
      console.log('Received message from socket:', data);
      const newMessage: ChatMessage = {
        id: data.id || uuidv4(), // Fallback nếu server không gửi id
        content: data.content,
        role: data.role as MessageRole,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        structured: data.structured || undefined,
        intent: data.intent || undefined,
        imageUrl: data.imageUrl || undefined,
        user_input: data.user_input || undefined,
      };

      // Append message (server emit cả user và AI message)
      setMessages((prev) => [...prev, newMessage]);

      // Lưu vào DB nếu cần (server đã lưu, nhưng để backup)
      saveChatHistory(currentUser?.user_id || 0, [newMessage]).catch((err) => {
        console.error('Error saving message:', err);
      });

      // Dừng loading sau khi nhận AI response (role ASSISTANT)
      if (newMessage.role === MessageRole.ASSISTANT) {
        setIsLoading(false);
      }

      // ✅ THÊM REDIRECT Ở ĐÂY: Tự động chuyển đến /financial_plan khi tạo kế hoạch thành công
      // Define a specific type for plan_created structured data
      interface PlanCreatedStructured {
        response_type: 'plan_created';
      }
      // Sử dụng type assertion để tránh TS error vì StructuredData không có response_type
      const structuredData = newMessage.structured as PlanCreatedStructured | undefined;
      if (newMessage.role === MessageRole.ASSISTANT && structuredData?.response_type === 'plan_created') {
        console.log('Redirecting to /financial_plan after planning confirmed');
        // Có thể delay 1s để user thấy message trước khi redirect
        setTimeout(() => {
          router.push('/financial_plan');
        }, 1500); // Optional: Delay để UX mượt
      }

      // ✅ THÊM XỬ LÝ AUTO-CONFIRMED TRANSACTION: Nếu intent = 'auto_confirmed_transaction' hoặc 'transaction' với group_name 'Giao dịch tự động'
      if (newMessage.intent === 'auto_confirmed_transaction' || 
          (newMessage.intent === 'transaction')) {  // Điều kiện match message từ ngân hàng

        // Hiển thị toast confirm (pop-up) - giữ nguyên
        toast.success(newMessage.content, {
          position: 'top-right',
          autoClose: 5000,
          toastId: newMessage.id,
          onClick: () => {
            console.log('Chi tiết giao dịch tự động:', newMessage.structured);
            // Optional: Mở modal chi tiết hoặc navigate
          },
        });

        // ✅ FIX MỚI: Tự động add ID vào confirmedIds để UI hiển thị confirmed view ngay
        setConfirmedIds((prev) => {
          const newConfirmedIds = [...prev, newMessage.id];
          // Lưu localStorage với expiry 1 ngày (giữ nguyên logic cũ)
          localStorage.setItem('confirmedIds', JSON.stringify({
            user_id: currentUser?.user_id || 1,
            ids: newConfirmedIds,
            expiry: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          }));
          return newConfirmedIds;
        });

        // Refresh transaction groups và overview (update UI số dư/list) - giữ nguyên
        refreshTransactionGroups();
        fetchOverview(currentUser?.user_id || 1).then((summary) => {
          console.log('Updated financial summary after auto-confirm:', summary.actual_balance);
          // Optional: Update global state số dư nếu có context
        });

        // Optional: Append một confirm message ngắn gọn nếu muốn (nhưng có thể skip để UI sạch)
        // const autoConfirmMsg: ChatMessage = {
        //   id: uuidv4(),
        //   content: `✅ Giao dịch từ ngân hàng đã được tự động lưu. Số dư: ${summary.actual_balance.toLocaleString('vi-VN')} VND`,
        //   role: MessageRole.ASSISTANT,
        //   timestamp: new Date(),
        // };
        // setMessages((prev) => [...prev, autoConfirmMsg]);  // Hoặc emit socket nếu cần sync

        // Không cần stop loading vì không liên quan
      }
    };

    

    socket.on('receive_message', handleReceiveMessage);
 
    // Lắng nghe error từ socket
    socket.on('error', (err: string) => {
      console.error('Socket error:', err);
      setError(err);
      setIsLoading(false);
    });

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('error');
    };
  }, [socket, currentUser?.user_id, router, refreshTransactionGroups]);

  const sendToApi = useCallback(async (message: string, updatedMessages: ChatMessage[], imageData?: FormData) => {
    if (isApiProcessing.current) return;
    isApiProcessing.current = true;

    try {
      let aiMessage: ChatMessage;
      if (imageData) {
        // Xử lý image: Upload trước, lấy imageUrl, emit socket cho user message, append AI local
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
          imageUrl, // imageUrl từ upload
          user_input: message,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
          intent: intent || 'document',
        };

        // Emit socket cho user message với imageUrl (server sẽ lưu và emit back user message)
        if (socket && currentUser?.user_id) {
          const clientId = uuidv4(); // Tạo id cho user message
          socket.emit('send_message', {
            userId: currentUser.user_id,
            message: 'Đã gửi hình ảnh',
            imageUrl,
            clientId, // Để server dùng id này
          });
        }

        // Append AI message local (vì image không qua socket AI)
        setMessages((prev) => [...prev, aiMessage]);
        saveChatHistory(currentUser?.user_id || 0, [aiMessage]);
      } else {
        // Text: Emit socket, server xử lý AI và emit back cả user + AI
        if (!socket || !currentUser?.user_id) {
          throw new Error('Socket chưa kết nối hoặc không có user ID');
        }

        const clientId = uuidv4(); // Tạo id cho user message
        socket.emit('send_message', {
          userId: currentUser.user_id,
          message,
          imageUrl: null,
          clientId, // Để server dùng id này cho user message
        });

        // Không append gì ở đây, chờ receive từ socket cho cả user và AI
      }
    } catch (err: unknown) {
      console.error('❌ Socket/API error:', err instanceof Error ? err.message : 'Unknown error');
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        content: `⚠️ Lỗi: ${err instanceof Error ? err.message : 'Không thể xử lý yêu cầu.'}`,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
      saveChatHistory(currentUser?.user_id || 0, [errorMsg]);
    } finally {
      isApiProcessing.current = false;
      // Không setIsLoading(false) ở đây, vì socket sẽ handle
    }
  }, [currentUser?.user_id, socket]);

  const handleSendMessage = useCallback(async (message: string, imageData?: FormData) => {
      if (!message.trim() && !imageData) return;

      // Không append user message local nữa, chờ server emit back (để sync multi-tab)
      // Nhưng cho UX instant, có thể append temp và replace sau, nhưng giữ đơn giản: chờ server

      setInputValue('');
      setIsLoading(true);

      await sendToApi(message, messages, imageData); // Pass current messages
    }, [sendToApi, messages]);

    const handleConfirm = async (message: ChatMessage, correctedData?: TransactionData | TransactionData[]): Promise<void> => {
      console.log('CONFIRM PAYLOAD:', {
        user_id: currentUser?.user_id || 1,
        user_input: message.user_input || message.content,
        ai_suggested: message.structured,
        user_corrected: correctedData || null,
        confirmed: true,
      });

      try {
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
            user_input: '', // Không có input từ user
          };

          // FIXED: Emit socket để sync (thay vì chỉ append local) - loại bỏ duplicate setMessages
          if (socket && currentUser?.user_id) {
            socket.emit('send_message', {
              userId: currentUser.user_id,
              message: confirmMsg.content, // Dùng content làm message
              isSystem: true,
              imageUrl: null,
              clientId: confirmMsg.id, // Để server dùng ID này
            });
            // Không append local, chờ receive_message
          } else {
            // Fallback nếu !socket: append local như cũ
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
          }

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
            user_input: '', // Không có input từ user
          };

          // FIXED: Emit socket để sync (thay vì chỉ append local)
          if (socket && currentUser?.user_id) {
            socket.emit('send_message', {
              userId: currentUser.user_id,
              message: confirmMsg.content, // Dùng content làm message
              imageUrl: null,
              isSystem: true,
              clientId: confirmMsg.id, // Để server dùng ID này
            });
            // Không append local, chờ receive_message
          } else {
            // Fallback nếu !socket: append local như cũ
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
          }

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
          user_input: '', // Không có input từ user
        };

        // FIXED: Emit socket cho error message để sync
        if (socket && currentUser?.user_id) {
          socket.emit('send_message', {
            userId: currentUser.user_id,
            message: errorMsg.content,
            imageUrl: null,
            clientId: errorMsg.id,
          });
          // Không append local, chờ receive_message
        } else {
          // Fallback nếu !socket: append local như cũ
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
    initializeSocket
  };

}