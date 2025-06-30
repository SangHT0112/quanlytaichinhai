import db from "../../config/db.js"

export const getTransactionsByUserId = async (userId) => {
  const [rows] = await db.execute(
    `SELECT transaction_id, description, amount, type, category_id, transaction_date
     FROM transactions
     WHERE user_id = ?
     ORDER BY transaction_date DESC`,
    [userId]
  )

  // Lấy tên danh mục
  const [categories] = await db.execute(`SELECT category_id, name FROM categories`)

  // Map category_id → name
  const categoryMap = {}
  categories.forEach((c) => {
    categoryMap[c.id] = c.name
  })

  return rows.map((t) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: categoryMap[t.category_id] || "Không rõ",
    date: t.transaction_date
  }))
}
