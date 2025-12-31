import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom'; // ✅ Import flushSync nếu cần force update (tùy chọn cho placeholder)
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
import { Socket } from 'socket.io-client';
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

  // ✅ FIX: handleReceiveMessage dùng useCallback với deps stable (tránh loop re-bind)
  const handleReceiveMessage = useCallback((data: SocketMessageData) => {
    console.log('🔥 Received message from socket:', data);  // Debug log

    // Check duplicate
    if (data.id && messages.some(msg => msg.id === data.id)) {
      console.log('Skipped duplicate:', data.id);
      return;
    }

    const newMessage: ChatMessage = {
      id: data.id || uuidv4(),
      content: data.content,
      role: data.role as MessageRole,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      structured: data.structured || undefined,
      intent: data.intent || undefined,
      imageUrl: data.imageUrl || undefined,
      user_input: data.user_input || undefined,
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // ✅ THÊM: Scroll to bottom sau append
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return updated;
    });

    // Backup save (optional)
    saveChatHistory(currentUser?.user_id || 0, [newMessage]).catch(console.error);

    if (newMessage.role === MessageRole.ASSISTANT) {
      setIsLoading(false);
    }

    // Redirect plan_created
    interface PlanCreatedStructured { response_type: 'plan_created'; }
    const structuredData = newMessage.structured as PlanCreatedStructured | undefined;
    if (newMessage.role === MessageRole.ASSISTANT && structuredData?.response_type === 'plan_created') {
      console.log('Redirecting to /financial_plan after planning confirmed');
      setTimeout(() => router.push('/financial_plan'), 1500);
    }

    // Auto-confirmed handling (chỉ intent cụ thể, remove || 'transaction' nếu không cần)
    if (newMessage.intent === 'auto_confirmed_transaction') {
      console.log('🔔 Handling auto-confirmed from webhook:', newMessage.structured);
      toast.success(newMessage.content, {
        position: 'top-right',
        autoClose: 5000,
        toastId: newMessage.id,
        onClick: () => console.log('Chi tiết giao dịch tự động:', newMessage.structured),
      });

      setConfirmedIds((prev) => {
        const newConfirmedIds = [...prev, newMessage.id];
        localStorage.setItem('confirmedIds', JSON.stringify({
          user_id: currentUser?.user_id || 1,
          ids: newConfirmedIds,
          expiry: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        }));
        return newConfirmedIds;
      });

      refreshTransactionGroups();
      fetchOverview(currentUser?.user_id || 1).then((summary) => {
        console.log('Updated financial summary after auto-confirm:', summary.actual_balance);
      });
    }
  }, [messages, currentUser?.user_id, router, refreshTransactionGroups]);  // ✅ THÊM: messages để check duplicate chính xác

    // ✅ UNIQUE fetchHistory: Chỉ 1 version (load 7 ngày, sort time)
    const fetchHistory = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];
        const history = await getChatHistory(currentUser?.user_id, 50, today);

        const uniqueHistory: ChatMessage[] = Array.from(
          new Map(history.map((msg: ChatMessage) => [msg.id, {
            ...msg,
            role: msg.role ?? MessageRole.USER,
            timestamp: msg.timestamp || new Date(),
          }])).values()
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setMessages(uniqueHistory);
        console.log(`📥 Loaded ${uniqueHistory.length} messages (for ${today})`);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Lỗi khi tải lịch sử chat.');
      } finally {
        setIsLoading(false);
      }
}, [currentUser?.user_id]);


  // ✅ useEffect socket: Bind handler đúng cách
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 Binding socket listeners');  // Debug
    socket.on('receive_message', handleReceiveMessage);
    socket.on('error', (err: string) => {
      console.log('Socket error:', err);
      setError(err);
      setIsLoading(false);
    });

    // ✅ THÊM: Listen refetch từ backend (nếu dùng)
    socket.on('refetch_history', () => {
      console.log('🔄 Refetching history on reconnect');
      fetchHistory();  // Call hàm fetch
    });

    return () => {
      console.log('🔌 Unbinding listeners');
      socket.off('receive_message', handleReceiveMessage);
      socket.off('error');
      socket.off('refetch_history');
    };
  }, [socket, handleReceiveMessage]);  // Deps: handle là callback ổn định

  // ✅ THÊM: useEffect cho connect & user_online (refetch sau reconnect)
  useEffect(() => {
    if (!socket || !currentUser?.user_id) return;

    const handleConnect = () => {
      console.log('✅ Socket connected, emitting user_online & refetch');  // Debug
      socket.emit('user_online', currentUser.user_id);  // Emit để backend add sockets
      // Refetch ngay để load missed webhook
      fetchHistory();  // Define hàm dưới
    };

    socket.on('connect', handleConnect);

    // Nếu đã connect rồi (reconnect), emit ngay
    if (socket.connected) {
      handleConnect();
    }

    return () => { socket.off('connect', handleConnect); };
  }, [socket, currentUser?.user_id, fetchHistory]);

  

  // ✅ Mount effect: Fetch initial history (NO duplicate define)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      console.warn('No user found in localStorage, redirecting to login');
      router.push('/login');
      return;
    }
    if (currentUser?.user_id) {
      fetchHistory();
    }
  }, [router, currentUser?.user_id, fetchHistory]);  // Deps OK

  // ConfirmedIds effect
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

  // ✅ FIXED: Helper function to update user message with real imageUrl after upload
  const updateUserMessageWithImage = useCallback((clientId: string, realImageUrl: string) => {
    setMessages((prev) => 
      prev.map((msg) =>
        msg.id === clientId
          ? { ...msg, imageUrl: realImageUrl, content: '' }  // Clear content, chỉ hiển thị image
          : msg
      )
    );
  }, []);

  const sendToApi = useCallback(async (message: string, updatedMessages: ChatMessage[], imageData?: FormData) => {
    if (isApiProcessing.current) return;
    isApiProcessing.current = true;

    try {
      let aiMessage: ChatMessage;
      if (imageData) {
        // ✅ FIXED: Xử lý image - Append placeholder trước (để hiển thị ngay), sau đó update với real URL
        console.log('Gửi yêu cầu xử lý tài liệu đến API:');
        const clientId = uuidv4();
        const placeholderUserMsg: ChatMessage = {
          id: clientId,
          role: MessageRole.USER,
          content: 'Đang tải hình ảnh...',  // Placeholder text tạm thời
          imageUrl: '',  // Empty ban đầu
          timestamp: new Date(),
        };

        // Append placeholder optimistic (hiển thị ngay)
        flushSync(() => {
          setMessages((prev) => [...prev, placeholderUserMsg]);
        });

        // Gọi API upload & process (trả về imageUrl)
        const res = await axiosInstance.post('/ai/process-document', imageData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('Phản hồi từ API xử lý tài liệu:', res.data);
        const { raw, imageUrl, structured, intent } = res.data;

        // ✅ FIXED: Update user message với real imageUrl (hiển thị hình ảnh luôn, clear content)
        updateUserMessageWithImage(clientId, imageUrl || '');  // Nếu imageUrl null, giữ empty

        // Tạo & append AI message
        aiMessage = {
          id: uuidv4(),
          content: raw || 'Đã xử lý tài liệu.',
          structured,
          imageUrl,  // AI cũng có thể reference image nếu cần
          user_input: message,
          role: MessageRole.ASSISTANT,
          timestamp: new Date(),
          intent: intent || 'document',
        };
        setMessages((prev) => [...prev, aiMessage]);
        saveChatHistory(currentUser?.user_id || 0, [aiMessage]);

        // ✅ FIXED: Emit socket cho user message VỚI real imageUrl (server lưu & emit back, duplicate skip)
        if (socket && currentUser?.user_id) {
          socket.emit('send_message', {
            userId: currentUser.user_id,
            message: '',  // Content empty vì chỉ image
            imageUrl: imageUrl || null,
            clientId,  // Trùng id để duplicate check
          });
        }
      } else {
        // Text: Emit socket, server xử lý AI và emit back cả user + AI
        if (!socket || !currentUser?.user_id) {
          throw new Error('Socket chưa kết nối hoặc không có user ID');
        }

        // ✅ FIXED: Emit cho text message (bị thiếu trước)
        const clientId = uuidv4();
        socket.emit('send_message', {
          userId: currentUser.user_id,
          message,
          imageUrl: null,
          clientId,  // Để server dùng id này
        });
        // Không append local, chờ receive từ server
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
      // Không setIsLoading(false) ở đây, vì socket sẽ handle cho text; cho image đã done
      if (imageData) setIsLoading(false);  // ✅ THÊM: Set loading false sau image process
    }
  }, [currentUser?.user_id, socket, updateUserMessageWithImage]);  // ✅ THÊM: deps cho helper

  const handleSendMessage = useCallback(async (message: string, imageData?: FormData) => {
      if (!message.trim() && !imageData) return;

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
};