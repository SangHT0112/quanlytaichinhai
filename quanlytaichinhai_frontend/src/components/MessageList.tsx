import { RefObject, useEffect } from 'react';
import { ChatMessage, TransactionData } from '@/utils/types';
import { MessageItem } from '@/components/MessageItem';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import ErrorBoundary from '@/components/ErrorBoundary';

interface MessageListProps {
  messages: ChatMessage[];
  confirmedIds: string[];
  isLoading: boolean;
  error: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onConfirm: (message: ChatMessage, correctedData?: TransactionData | TransactionData[]) => Promise<void>;
  onSaveEdit: (messageId: string, editedData: TransactionData, editingIndex: number) => Promise<void>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  confirmedIds,
  isLoading,
  error,
  messagesEndRef,
  onConfirm,
  onSaveEdit,
}) => {
  const hasMessages = messages.length > 0;

  // Effect để cập nhật window.hasMessages
  useEffect(() => {
    window.hasMessages = hasMessages;
  }, [hasMessages]);

  // Effect để auto-scroll xuống dưới khi messages thay đổi
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [messages, isLoading, messagesEndRef]); // Thêm dependencies

  return (
   <div
    className={`flex-1 overflow-y-auto space-y-4 sm:px-16 message-container ${
        !hasMessages ? 'flex flex-col justify-center items-center' : ''
    }`}
    style={{ maxHeight: 'calc(100vh - 150px)' }} // Tăng lên 150px để bù cho QuickActions và ChatInput
    >
    <div className="mt-3">
        {error && <div className="text-red-500 text-center">{error}</div>}
        <ErrorBoundary>
        {messages.map((msg) => (
            <MessageItem
            key={msg.id}
            message={msg}
            onConfirm={onConfirm}
            confirmedIds={confirmedIds}
            onSaveEdit={onSaveEdit}
            />
        ))}
        </ErrorBoundary>
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
    </div>
    </div>
  );
};