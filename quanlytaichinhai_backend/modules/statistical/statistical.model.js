import db from "../../config/db.js"

export async function getExpensePieChart(userId) {
  const sql = `
    SELECT c.name AS category_name, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? AND t.type = 'expense'
      AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE())
      AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE())
    GROUP BY t.category_id
  `
  const [rows] = await db.execute(sql, [userId])
  return rows
}

export async function getDailySpendingTrend(userId) {
  const sql = `
    SELECT DATE_FORMAT(t.transaction_date, "%e") AS day, SUM(t.amount) AS amount
    FROM transactions t
    WHERE t.user_id = ? AND t.type = 'expense'
      AND t.transaction_date >= CURDATE() - INTERVAL 15 DAY
    GROUP BY DATE(t.transaction_date)
    ORDER BY t.transaction_date
  `
  const [rows] = await db.execute(sql, [userId])
  return rows
}

export async function getMonthlyIncomeVsExpense(userId) {
  const sql = `
    SELECT 
      DATE_FORMAT(t.transaction_date, "%m/%Y") AS month,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense
    FROM transactions t
    WHERE t.user_id = ?
      AND t.transaction_date >= CURDATE() - INTERVAL 4 MONTH
    GROUP BY YEAR(t.transaction_date), MONTH(t.transaction_date)
    ORDER BY t.transaction_date
  `
  const [rows] = await db.execute(sql, [userId])
  return rows
}

export async function getTopCategories(userId) {
  const sql = `
    SELECT c.name AS category_name, c.icon, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? AND t.type = 'expense'
    GROUP BY t.category_id
    ORDER BY total DESC
    LIMIT 6
  `
  const [rows] = await db.execute(sql, [userId])
  return rows
}

export async function getFinancialSummary(userId) {
  const sql = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE user_id = ?
      AND MONTH(transaction_date) = MONTH(CURRENT_DATE())
      AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
  `
  const [[summary]] = await db.execute(sql, [userId])
  const balance = summary.income - summary.expense
  return { ...summary, balance }
}
