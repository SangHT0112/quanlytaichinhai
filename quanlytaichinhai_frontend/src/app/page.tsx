'use client';
import { useEffect, useState, useRef } from 'react';
import { useChatAI } from '@/hooks/useChatAI';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';
import { useGlobalWindowFunctions } from '@/hooks/useGlobalWindowFunctions';
import { MessageList } from '@/components/MessageList';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import QuickActions from '@/components/QuickActions';
import { useSocket } from '@/app/layout'; // Import useSocket từ RootLayout (hoặc file layout.tsx nếu tách)

// ✅ NEW: Import modal component (giả sử bạn có Modal component, hoặc dùng native dialog)
import { Modal } from '@/components/Modal'; // Hoặc tạo inline nếu chưa có

export default function ChatAI() {
  
  const {
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
    initializeSocket, // Đảm bảo export từ useChatAI
  } = useChatAI();

  const { socket } = useSocket(); // Lấy socket từ context

  // ✅ SIMPLIFIED: State cho modal timeout
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useBackgroundManager();
  useGlobalWindowFunctions(handleSendMessage, setInputValue, inputValue);

  // Set socket cho hook khi có
  useEffect(() => {
    if (socket && currentUser?.user_id && initializeSocket) {
      console.log('Initializing socket in ChatAI:', socket.id);
      initializeSocket(socket);
    }
  }, [socket, currentUser?.user_id, initializeSocket]);

  const hasMessages = messages.length > 0;
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest',
        });
      });
    }
  }, [messages, messagesEndRef]);

  // Thêm vào ChatAI.tsx
  useEffect(() => {
    const handleSendChatEvent = (event: CustomEvent) => {
      const message = event.detail;
     // console.log('Received send-chat event:', message);
      handleSendMessage(message);
    };

    // Lắng nghe sự kiện từ window
    const eventHandler = (e: Event) => handleSendChatEvent(e as CustomEvent);
    window.addEventListener('send-chat', eventHandler);
    
    return () => {
      window.removeEventListener('send-chat', eventHandler);
    };
  }, [handleSendMessage]);

  // ✅ SIMPLIFIED: Handle timeout modal khi isLoading
  useEffect(() => {
    if (isLoading) {
      // Clear timeout cũ nếu có
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set timeout 10s để show modal
      timeoutRef.current = setTimeout(() => {
        setShowTimeoutModal(true);
      }, 10000); // 10 giây
    } else {
      // Clear modal và timeout khi response về (không còn loading)
      setShowTimeoutModal(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup khi unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  // ✅ NEW: Handler cho retry từ modal
  const handleRetry = () => {
    setShowTimeoutModal(false); // Đóng modal
    // Trigger retry: Resend last message hoặc clear loading (tùy hook)
    // Ví dụ: Nếu hook có reset, gọi nó; hoặc dispatch event để resend
    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user' && lastUserMessage.user_input) {
        handleSendMessage(lastUserMessage.user_input);
      }
    }
  };

  // ✅ SIMPLIFIED: Không cần pending message, chỉ messages gốc
  return (
    <div className="flex flex-col h-full bg-cover bg-center pb-20 md:pb-0">
      <MessageList
        messages={messages} // Giữ nguyên messages, không cần pending
        confirmedIds={confirmedIds}
        isLoading={isLoading}
        error={error}
        messagesEndRef={messagesEndRef}
        onConfirm={handleConfirm}
        onSaveEdit={handleSaveEdit}
      />

      {!hasMessages ? (
        <WelcomeScreen 
          userId={currentUser?.user_id || 1} 
          onQuickAction={handleQuickAction} 
        />
      ) : (
        <>
          <div className="z-50 px-4 fixed bottom-0 left-0 right-0 pb-4 bg-transparent">
            <div className="w-full max-w-3xl mx-auto">
              {/* Bỏ comment nếu cần ChatInput riêng cho chat page, nhưng layout đã có fixed ChatInput global */}
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

      {/* ✅ FIXED: Modal timeout với backdrop trong suốt (bg-transparent) để thấy chat */}
      <Modal isOpen={showTimeoutModal} onClose={() => setShowTimeoutModal(false)}>
        <div className="p-6 text-center">
         <h2 className="text-xl font-bold text-gray-800 mb-4">⏰ Quá thời gian chờ</h2>
         <p className="text-gray-600 mb-4">
            Xin lỗi vì đã để bạn chờ quá lâu (khoảng 90 giây). 
            Hệ thống đang gặp chậm trễ trong quá trình xử lý. 
            Bạn có thể thử lại để tiếp tục.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              onClick={() => setShowTimeoutModal(false)}
            >
              Đóng
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={handleRetry}
            >
              Thử lại
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}