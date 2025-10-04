'use client';
import { useEffect } from 'react';
import { useChatAI } from '@/hooks/useChatAI';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';
import { useGlobalWindowFunctions } from '@/hooks/useGlobalWindowFunctions';
import { MessageList } from '@/components/MessageList';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import QuickActions from '@/components/QuickActions';

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
  } = useChatAI();

  useBackgroundManager();
  useGlobalWindowFunctions(handleSendMessage, setInputValue, inputValue);

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
  return (
    <div className="flex flex-col h-full bg-cover bg-center pb-20 md:pb-0">
      <MessageList
        messages={messages}
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