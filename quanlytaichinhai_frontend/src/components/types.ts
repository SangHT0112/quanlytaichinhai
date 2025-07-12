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
  'WeeklyBarChart',
  
  'MonthlyBarChart',
  'TransactionConfirmationForm'

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
  content: string;                 // Chuẩn OpenAI (luôn có)
  custom_content?: MessageContentPart[];    // Mở rộng để render component/text phức tạp.
  structured?: any
  user_id?: number;
  name?: string; 
  user_input?: string                           // Cho function/components
  function_call?: {                        //Dữ liệu khi AI gọi hàm (ví dụ: get_current_weather).
    name: string;
    arguments: string;
  };
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  intent?: string
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




// // ========= Ví dụ các trường hợp ============== //
// // Tin nhắn text thông thường
// const simpleMessage: ChatMessage = {
//   id: "1",
//   role: MessageRole.ASSISTANT,
//   content: "Xin chào!",
//   timestamp: new Date()
// };

// // Tin nhắn kết hợp text + component
// const complexMessage: ChatMessage = {
//   id: "2",
//   role: MessageRole.ASSISTANT,
//   content: "Đây là biểu đồ:",
//   custom_content: [
//     { type: "text", text: "Chi tiết:", style: "important" },
//     { type: "component", name: "MonthlyBarChart", props: { months: 6 } }
//   ],
//   timestamp: new Date()
// };

// // Function call từ AI
// const functionCallMessage: ChatMessage = {
//   id: "3",
//   role: MessageRole.ASSISTANT,
//   content: null,
//   function_call: {
//     name: "get_current_weather",
//     arguments: '{"location": "Hà Nội"}'
//   },
//   timestamp: new Date()
// };