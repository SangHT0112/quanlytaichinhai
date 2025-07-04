import { ReactNode } from "react";
// 1. Định nghĩa enum cho các role (chuẩn OpenAI)
export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  FUNCTION = "function" // Cho function calling
}

// 2. Component types (giữ nguyên)
const ALLOWED_COMPONENTS = [
  'BalanceCardPage',
  'TopExpenseCategories',
  'TransactionList',
  'MonthlyBarChart'
] as const;

export type AllowedComponents = typeof ALLOWED_COMPONENTS[number];

// 3. Kiểu message content mới (tương thích OpenAI + custom components)
export type MessageContentPart = 
  | { 
      type: 'text'; 
      text: string; // Đổi từ content -> text để giống OpenAI
      style?: 'default' | 'important' | 'warning';
    }
  | { 
      type: 'component',
      name: AllowedComponents,
      props?: Record<string, unknown>,
      layout?: 'inline' | 'block'
    }
  | {
      type: 'function_call', // Thêm để tương thích OpenAI function calling
      name: string,
      arguments: string
    };

// 4. Kiểu message hoàn chỉnh (kết hợp cả OpenAI và custom)
export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string | null; // Chuẩn OpenAI (luôn có)
  custom_content?: MessageContentPart[]; // Phần mở rộng của bạn
  name?: string; // Cho function/components
  function_call?: { // Chuẩn OpenAI
    name: string;
    arguments: string;
  };
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
};

// 5. Kiểu response tổng (tương thích OpenAI)
export interface ChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  choices: {
    message: ChatMessage;
    finish_reason: "stop" | "length" | "function_call" | "content_filter";
    index: number;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 6. Giữ nguyên QuickAction
export type QuickAction = {
  id: string;
  text: string;
  emoji: string;
  shortcut?: string;
};

// Export const (giữ nguyên)
export const AllowedComponentsList = ALLOWED_COMPONENTS;
export type MessageContent = string | MessageContentPart | MessageContentPart[];