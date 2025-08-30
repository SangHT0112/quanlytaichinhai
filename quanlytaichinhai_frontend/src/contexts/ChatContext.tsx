// contexts/ChatContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ChatContextType {
  handleSendMessage: (message: string, imageData?: FormData) => void;
  handleQuickAction: (action: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({
  children,
  handleSendMessage,
  handleQuickAction,
}: {
  children: ReactNode;
  handleSendMessage: (message: string, imageData?: FormData) => void;
  handleQuickAction: (action: string) => void;
}) => {
  return (
    <ChatContext.Provider value={{ handleSendMessage, handleQuickAction }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};