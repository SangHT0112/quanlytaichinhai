import {
  getExpensePieChart,
  getDailySpendingTrend,
  getMonthlyIncomeVsExpense,
  getTopCategories,
  getFinancialSummary,
} from './statistical.model.js'

export async function expensePieChart(req, res) {
  const { user_id } = req.query
  const data = await getExpensePieChart(user_id)
  res.json(data)
}

export async function dailyTrend(req, res) {
  const { user_id } = req.query
  const data = await getDailySpendingTrend(user_id)
  res.json(data)
}

export async function monthlyIncomeExpense(req, res) {
  const { user_id } = req.query
  const data = await getMonthlyIncomeVsExpense(user_id)
  res.json(data)
}

export async function topCategories(req, res) {
  const { user_id } = req.query
  const data = await getTopCategories(user_id)
  res.json(data)
}

export async function overview(req, res) {
  const { user_id } = req.query
  const data = await getFinancialSummary(user_id)
  res.json(data)
}
