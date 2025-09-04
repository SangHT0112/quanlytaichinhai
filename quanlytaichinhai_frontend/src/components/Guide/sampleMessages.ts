import { ChatMessage, MessageRole } from "@/utils/types";
import { v4 as uuidv4 } from "uuid";

// Sample message sequences for each menu item in GuideButton
export const sampleMessageSequences: Record<string, ChatMessage[]> = {
  "Thêm giao dịch thủ công qua chat": [
    {
      id: uuidv4(),
      content: "Hôm nay tôi chi 50000 cho ăn uống",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "✅ Giao dịch chi 50,000 VND cho ăn uống đã được ghi nhận (mô phỏng trong hướng dẫn).",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
      structured: {
        transactions: [{ type: "expense", category: "ăn uống", amount: 50000 }],
      },
    },
  ],
  "Thêm nhiều giao dịch cùng lúc": [
    {
      id: uuidv4(),
      content: "Thêm chi 50000 ăn uống, 20000 xăng xe, thu 1000000 lương",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content:
        "✅ Đã ghi nhận (mô phỏng trong hướng dẫn):\n- Chi 50,000 VND (ăn uống)\n- Chi 20,000 VND (xăng xe)\n- Thu 1,000,000 VND (lương)",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
      structured: {
        transactions: [
          { type: "expense", category: "ăn uống", amount: 50000 },
          { type: "expense", category: "xăng xe", amount: 20000 },
          { type: "income", category: "lương", amount: 1000000 },
        ],
      },
    },
  ],
  "Thêm giao dịch dạng chi tiết trong 1 lần đi chợ/mua sắm": [
    {
      id: uuidv4(),
      content: "Tôi đi chợ mua rau 20000, thịt 50000, cá 30000",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content:
        "✅ Đã ghi nhận (mô phỏng trong hướng dẫn):\n- Chi 20,000 VND (rau)\n- Chi 50,000 VND (thịt)\n- Chi 30,000 VND (cá)",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
      structured: {
        transactions: [
          { type: "expense", category: "ăn uống", amount: 20000, description: "rau" },
          { type: "expense", category: "ăn uống", amount: 50000, description: "thịt" },
          { type: "expense", category: "ăn uống", amount: 30000, description: "cá" },
        ],
        group_name: "đi chợ",
      },
    },
  ],
  "Thêm giao dịch khi thiếu giá tiền → AI hỏi bổ sung": [
    {
      id: uuidv4(),
      content: "Nay tôi đi ăn phở",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "Bạn đã chi bao nhiêu tiền cho món phở? Vui lòng cung cấp số tiền (ví dụ: 35k).",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "35k",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "✅ Giao dịch ăn phở với số tiền 35,000 VND đã được ghi nhận (mô phỏng trong hướng dẫn).",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
      structured: {
        transactions: [{ type: "expense", category: "ăn uống", amount: 35000, description: "ăn phở" }],
      },
    },
  ],
  "Thêm giao dịch qua hình ảnh hóa đơn (Baml + Gemini)": [
    {
      id: uuidv4(),
      content: "Đã gửi hình ảnh hóa đơn",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "✅ Đã trích xuất giao dịch từ hóa đơn (mô phỏng trong hướng dẫn): Chi 50,000 VND (ăn uống).",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
      structured: {
        transactions: [{ type: "expense", category: "ăn uống", amount: 50000 }],
      },
    },
  ],
  "Xem số dư hiện tại": [
  {
    id: uuidv4(),
    content: "Số dư hiện tại là bao nhiêu?",
    role: MessageRole.USER,
    timestamp: new Date(),
  },
  {
    id: uuidv4(),
    content: "💰 Sau đây là tổng quan tài chính của bạn (mô phỏng trong hướng dẫn):",
    role: MessageRole.ASSISTANT,
    timestamp: new Date(),
    custom_content: [
      {
        type: "component",
        name: "BalanceCardPage",
        props: { balance: 5000000, currency: "VND" },
        layout: "block",
      },
    ],
  },
],

"Xem giao dịch trong 1 ngày yêu cầu": [
  {
    id: uuidv4(),
    content: "Giao dịch ngày hôm nay",
    role: MessageRole.USER,
    timestamp: new Date(),
  },
  {
    id: uuidv4(),
    content: "Danh sách giao dịch hôm nay (mô phỏng trong hướng dẫn):",
    role: MessageRole.ASSISTANT,
    timestamp: new Date(),
    custom_content: [
      {
        type: "component",
        name: "TransactionList",
        props: { dateFilter: "today", limit: 5 },
        layout: "block",
      },
    ],
  },
],

"Xem thống kê chi tiêu theo tháng": [
  {
    id: uuidv4(),
    content: "Thống kê chi tiêu tháng này",
    role: MessageRole.USER,
    timestamp: new Date(),
  },
  {
    id: uuidv4(),
    content: "Thống kê chi tiêu tháng này (mô phỏng):",
    role: MessageRole.ASSISTANT,
    timestamp: new Date(),
    custom_content: [
      {
        type: "component",
        name: "ExpensePieChart",
        props: { timeRange: "month" },
        layout: "block",
      },
      {
        type: "component",
        name: "MonthlyBarChart",
        props: { initialMonths: 1 },
        layout: "block",
      },
    ],
  },
],

"Xem chi tiêu trong 1 tuần vừa qua": [
  {
    id: uuidv4(),
    content: "Chi tiêu tuần qua",
    role: MessageRole.USER,
    timestamp: new Date(),
  },
  {
    id: uuidv4(),
    content: "Chi tiêu tuần qua (mô phỏng):",
    role: MessageRole.ASSISTANT,
    timestamp: new Date(),
    custom_content: [
      {
        type: "component",
        name: "WeeklyBarChart",
        props: { initialWeeks: 1 },
        layout: "block",
      },
      {
        type: "component",
        name: "TopExpenseCategories",
        props: {
          categories: [
            { name: "Ăn uống", amount: 800000 },
            { name: "Xăng xe", amount: 200000 },
          ],
          limit: 5,
        },
        layout: "block",
      },
    ],
  },
],

  "Hỏi AI về chi tiêu của một cái gì đó bao nhiêu tiền": [
    {
      id: uuidv4(),
      content: "Tổng chi ăn uống tháng này",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "Tổng chi cho ăn uống tháng này là 1,200,000 VND (mô phỏng trong hướng dẫn).",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
  ],
  "Hỏi AI chi tiêu tháng nào cao nhất": [
    {
      id: uuidv4(),
      content: "Tháng nào chi tiêu cao nhất năm nay",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "Tháng 8 có chi tiêu cao nhất: 3,000,000 VND (mô phỏng trong hướng dẫn).",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
  ],
  "Hỏi AI liệt kê theo yêu cầu": [
    {
      id: uuidv4(),
      content: "Liệt kê tất cả giao dịch ăn uống",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "Danh sách giao dịch ăn uống (mô phỏng trong hướng dẫn):\n- 50,000 VND (01/09)\n- 30,000 VND (02/09)",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
  ],
  "Hỏi AI so sánh giữa tháng x và tháng y": [
    {
      id: uuidv4(),
      content: "So sánh chi tiêu tháng 8 và tháng 9",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "So sánh (mô phỏng trong hướng dẫn):\n- Tháng 8: 3,000,000 VND\n- Tháng 9: 2,500,000 VND",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
  ],
  "Hỏi AI xu hướng chi tiêu": [
    {
      id: uuidv4(),
      content: "Xu hướng chi tiêu năm nay",
      role: MessageRole.USER,
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      content: "Xu hướng chi tiêu năm nay (mô phỏng trong hướng dẫn): Chi tiêu tăng dần từ tháng 1 đến tháng 8.",
      role: MessageRole.ASSISTANT,
      timestamp: new Date(),
    },
  ],
};