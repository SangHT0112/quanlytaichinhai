// types/financial.d.ts
export interface FinancialSummary {
  // Số dư và tài sản
  actual_balance: number;          // Số dư thực tế từ tài khoản
  monthly_surplus: number;         // Chênh lệch thu/chi tháng này (income - expense)
  total_assets?: number;           // Tổng tài sản (nếu có)

  // Thu nhập
  current_income: number;          // Thu nhập tháng hiện tại
  previous_income: number;         // Thu nhập tháng trước
  income_change_percentage: number; // % thay đổi thu nhập

  // Chi tiêu
  current_expense: number;         // Chi tiêu tháng hiện tại
  previous_expense?: number;       // Chi tiêu tháng trước (nếu có)
  expense_change_percentage?: number; // % thay đổi chi tiêu

  // Dữ liệu thô cho AI
  raw_data?: {
    monthly_income: number[];      // Lịch sử thu nhập các tháng
    monthly_expense: number[];     // Lịch sử chi tiêu các tháng
  };

  // Meta
  last_updated: string;            // Timestamp ISO 8601
  currency?: string;               // Đơn vị tiền tệ (VND/USD)
}

export interface TopCategory {
  category_id: number;
  category_name: string;
  total: number;
  percentage?: number;    // % trong tổng chi tiêu
  icon: string;
  color?: string;         // Màu sắc cho UI
}

export interface WeeklyExpense {
  day: string;           // 'Monday', 'Tuesday'...
  amount: number;
  trend?: number;        // % thay đổi so với tuần trước
}

// Cho biểu đồ chi tiêu
export interface ExpenseChartData {
  name: string;
  value: number;
  color?: string;
}