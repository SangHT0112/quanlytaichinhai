import db from "../../config/db.js"
import { format, subDays } from "date-fns"

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


export async function getDailySpendingTrend(userId, days = 5) {
  const today = new Date()

  const dayList = Array.from({ length: days }).map((_, i) => {
    const date = subDays(today, days - 1 - i) // ngày trước đến hôm nay
    return {
      dateKey: format(date, "dd/MM"),
      sqlDate: format(date, "yyyy-MM-dd"),
    }
  })

  const sql = `
    SELECT DATE(t.transaction_date) as raw_date, SUM(t.amount) AS amount
    FROM transactions t
    WHERE t.user_id = ? AND t.type = 'expense'
      AND t.transaction_date >= CURDATE() - INTERVAL ? DAY
    GROUP BY DATE(t.transaction_date)
  `

  const [rows] = await db.execute(sql, [userId, days - 1])

  const dataMap = Object.fromEntries(
    rows.map((row) => [format(new Date(row.raw_date), "dd/MM"), Number(row.amount)])
  )

  const result = dayList.map((d) => ({
    day: d.dateKey,
    amount: dataMap[d.dateKey] || 0,
  }))

  return result
}


export async function getMonthlyIncomeVsExpense(userId, months = 4) {
  const sql = `
    SELECT 
      month,
      SUM(income) AS income,
      SUM(expense) AS expense
    FROM (
      SELECT 
        DATE_FORMAT(t.transaction_date, "%m/%Y") AS month,
        CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END AS income,
        CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END AS expense
      FROM transactions t
      WHERE t.user_id = ?
        AND t.transaction_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? MONTH), '%Y-%m-01')
    ) AS sub
    GROUP BY month
    ORDER BY STR_TO_DATE(month, "%m/%Y") DESC
    LIMIT ?
  `

  // Lấy từ đầu tháng cách đây (months) tháng (ví dụ months=4 thì lấy từ đầu tháng 4 tháng trước)
  const [rows] = await db.execute(sql, [userId, months - 1, months])
  return rows.reverse()
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



