import { TopCategory, FinancialSummary } from './../types/financial.d';
import axiosInstance from "@/config/axios"
export async function fetchOverview(userId: number): Promise<FinancialSummary> {
  const res = await axiosInstance.get<FinancialSummary>('/overview', {
    params: { user_id: userId }
  })

  return res.data
}

export async function fetchTopCategories(userId: number) {
  const res = await axiosInstance.get("/overview/top-categories", {
    params: { user_id: userId },
  })
  return res.data // Array<{ category_name: string, total: number }>
}

export async function fetchExpensePieChart(userId: number) {
  const res = await axiosInstance.get("/overview/expense-pie-chart", {
    params: { user_id: userId },
  })
  return res.data // Array<{ category_name: string, total: number }>
}

export async function fetchWeeklyExpenses(userId: number) {
  const res = await axiosInstance.get("/overview/weekly-expenses", {
    params: { user_id: userId },
  })
  return res.data // Array<{ day: string, chi: number }>
}