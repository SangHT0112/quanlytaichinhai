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
  const { user_id, days } = req.query
  const parsedUserId = Number(user_id)
  const parsedDays = Number(days) || 5

  const data = await getDailySpendingTrend(parsedUserId, parsedDays)
  res.json(data)
}
export async function monthlyIncomeExpense(req, res) {
  const { user_id, months = 4 } = req.query
  const data = await getMonthlyIncomeVsExpense(user_id, parseInt(months))
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
