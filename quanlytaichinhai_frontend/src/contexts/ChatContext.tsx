// contexts/ChatContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isInitialState: boolean;
  setIsInitialState: (value: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isInitialState, setIsInitialState] = useState(true);

  return (
    <ChatContext.Provider value={{ isInitialState, setIsInitialState }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}