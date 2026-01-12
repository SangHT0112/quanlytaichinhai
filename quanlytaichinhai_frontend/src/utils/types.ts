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
      introText?: string;
      props?: Record<string, unknown>;
      layout?: 'inline' | 'block';
    }
  | {
      type: 'function_call';
      name: string;
      arguments: string;
    };

// utils/types.ts (hoặc file chứa StructuredData)

// Thêm vào union StructuredData
// utils/types.ts

export interface FollowupData {
  question: string;
  suggestedQuery: string;
}

export interface SqlQueryStructured {
  query?: string;
  result?: unknown;
  answer?: string;
  followup?: FollowupData; // Thêm optional followup
}

// ✅ NEW: Interfaces cho delete data
export interface DeleteDataConfirmStructured {
  response_type: 'delete_data_confirm';
  requires_confirm?: boolean;
  message?: string;
}

export interface DeleteDataSuccessStructured {
  response_type: 'delete_data_success';
  deleted_count?: number;
  message?: string;
}

// Cập nhật StructuredData để bao gồm SqlQueryStructured
export type StructuredData =
  | {
      transactions?: Array<{
        type: 'expense' | 'income';
        amount: number;
        category: string;
        date?: string;
        user_id?: number;
        description?: string;
        transaction_date?: string;
      }>;
      group_name?: string;
      total_amount?: number;
      transaction_date?: string;
      image_path?: string;
      image_url?: string;
    }
  | {
      type: 'component';
      name: AllowedComponents;
      introText?: string;
      props?: Record<string, unknown>;
      layout?: 'inline' | 'block';
    }
  | {
      response_type: 'confirm_priority';
      temp_plans: PlanData[];
      priority_options: string[];
      message: string;
    }
  | {
      response_type: 'suggest_new_category';
      message: string;
      suggest_new_category: {
        name: string;
        type: 'expense' | 'income';
        parent_id: number | null;
        color: string | null;
        icon: string | null;
      };
      temporary_transaction?: {
        group_name?: string;
        transaction_date?: string;
        user_id?: number;
        total_amount?: number;
        transactions: Array<{
          type: 'expense' | 'income';
          amount: number;
          category: string;
          description?: string;
          date?: string;
          user_id?: number;
          transaction_date?: string;
        }>;
      };
    }
  | SqlQueryStructured // Thêm kiểu SqlQueryStructured vào union
  // ✅ NEW: Thêm arms cho delete data
  | DeleteDataConfirmStructured
  | DeleteDataSuccessStructured;
// 5. Kiểu cho TransactionData (từ MessageItem.tsx)
export interface TransactionData {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  date?: string;
  user_id: number;
  description: string;
  transaction_date: string;
}

// 6. Kiểu message hoàn chỉnh (kết hợp cả OpenAI và custom)
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  custom_content?: MessageContentPart[];
  structured?: StructuredData;
  user_id?: number;
  name?: string;
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

export type PlanData = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  time_to_goal: number;
  priority: string;
  category: string;
  breakdown?: Record<string, number>;
  ai_analysis?: {
    feasibility_score: number;
    risk_level: string;
    recommendations: Array<{
      type: string;
      title: string;
      description?: string | null;
      impact?: string | null;
      priority: string;
    }>;
    milestones: Array<{
      amount: number;
      timeframe: string;
      description?: string | null;
    }>;
    monthly_breakdown: {
      current_savings: number;
      optimized_savings: number;
      with_investment: number;
    };
    challenges: string[];
    tips: string[];
  };
  created_at: string;
};

// Export const
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