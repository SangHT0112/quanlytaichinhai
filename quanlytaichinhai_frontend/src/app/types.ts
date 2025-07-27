// 1. Định nghĩa enum cho các role (chuẩn OpenAI)
export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  FUNCTION = "function" // Cho function calling
}

// 2. Component types
const ALLOWED_COMPONENTS = [
  'BalanceCardPage',
  'TopExpenseCategories',
  'TransactionList',
  'WeeklyBarChart',
  'CategoryDetailList',
  'DailySpendingAreaChart',
  'MonthlyBarChart',
  'ExpensePieChart',
  'TransactionConfirmationForm'
] as const;

export type AllowedComponents = typeof ALLOWED_COMPONENTS[number];

// 3. Kiểu message content mới (tương thích OpenAPI + custom components)
export type MessageContentPart = 
  | { 
      type: 'text'; 
      text: string;
      style?: 'default' | 'important' | 'warning';
    }
  | { 
      type: 'component';
      name: AllowedComponents;
      props?: Record<string, unknown>;
      layout?: 'inline' | 'block';
    }
  | {
      type: 'function_call';
      name: string;
      arguments: string;
    };

// 4. Định nghĩa kiểu cho structured
export type StructuredData =
  | {
      transactions?: Array<{
        type: 'expense' | 'income';
        category?: string;
        amount?: number;
        user_id?: number;
        date?: string;
        transaction_date?: string;
        description?: string;
      }>;
      group_name?: string;
      total_amount?: number;
      transaction_date?: string;
    }
  | {
      type: 'component';
      name: AllowedComponents;
      introText?: string;
      props?: Record<string, unknown>;
      layout?: 'inline' | 'block';
    };


// 5. Kiểu cho TransactionData (từ MessageItem.tsx)
export interface TransactionData {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date?: string;
  transaction_date: string;
  user_id: number;
}

// 6. Kiểu message hoàn chỉnh
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  custom_content?: MessageContentPart[];
  structured?: StructuredData;
  name?: string;
  user_id?: number;
  user_input?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  imageUrl?: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  intent?: string;
}

// 7. Kiểu response tổng (tương thích OpenAI)
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

// 8. Giữ nguyên QuickAction
export type QuickAction = {
  id: string;
  text: string;
  emoji: string;
  shortcut?: string;
};

// 9. Định nghĩa props cho ChatInput
export interface ChatInputProps {
  isSidebarOpen: boolean;
  pathname: string;
}

// Export const
export const AllowedComponentsList = ALLOWED_COMPONENTS;
export type MessageContent = string | MessageContentPart | MessageContentPart[];