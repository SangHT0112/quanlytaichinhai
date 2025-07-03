import axiosInstance from "@/config/axios"

export interface FinancialSummary {
  balance: number
  income: number
  expense: number
}

// Tổng quan thu nhập - chi tiêu - số dư
export async function fetchOverview(userId: number): Promise<FinancialSummary> {
  const res = await axiosInstance.get<FinancialSummary>("/statistical", {
    params: { user_id: userId },
  })
  return res.data
}

// Top danh mục chi tiêu
export async function fetchTopCategories(userId: number) {
  const res = await axiosInstance.get("/statistical/top-categories", {
    params: { user_id: userId },
  })
  return res.data // Array<{ category_name: string, icon: string, total: number }>
}

// Biểu đồ tròn chi tiêu theo danh mục
export async function fetchExpensePieChart(userId: number) {
  const res = await axiosInstance.get("/statistical/expense-pie-chart", {
    params: { user_id: userId },
  })
  return res.data // Array<{ category_name: string, total: number }>
}

// Biểu đồ cột chi tiêu theo tuần
export async function fetchWeeklyExpenses(userId: number) {
  const res = await axiosInstance.get("/statistical/weekly-expenses", {
    params: { user_id: userId },
  })
  return res.data // Array<{ day: string, chi: number }>
}

// Biểu đồ xu hướng chi tiêu 15 ngày gần nhất
export async function fetchDailySpendingTrend(userId: number, days:number) {
  const res = await axiosInstance.get("/statistical/daily-trend", {
    params: { user_id: userId, days },
  })
  return res.data // Array<{ day: string, amount: number }>
}

// Biểu đồ thu nhập vs chi tiêu theo tháng
export async function fetchMonthlyIncomeVsExpense(userId: number, months:number) {
  const res = await axiosInstance.get("/statistical/monthly-income-expense", {
    params: {
      user_id: userId,
      months: months
    },
  })
  return res.data // Array<{ month: string, income: number, expense: number }>
}
