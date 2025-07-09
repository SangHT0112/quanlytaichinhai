import db from "../../config/db.js"

export const getTransactionsByUserId = async (userId, limit = null) => {
  let query = `
    SELECT 
      t.transaction_id, 
      t.description, 
      t.amount, 
      t.type, 
      t.category_id, 
      t.transaction_date,
      c.name AS category_name,
      c.icon AS category_icon
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.category_id
    WHERE t.user_id = ?
    ORDER BY t.transaction_date DESC
  `
  
  const params = [userId]
  
  // Thêm LIMIT nếu có yêu cầu
  if (limit && Number.isInteger(limit)) {
    query += ' LIMIT ?'
    params.push(limit)
  }

  const [rows] = await db.execute(query, params)

  return rows.map((t) => ({
    id: t.transaction_id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category_name || "Không rõ",
    icon: t.category_icon || (t.type === 'income' ? '💰' : '💸'),
    date: t.transaction_date
  }))
}


// Lấy 5 giao dịch gần nhất
//const recentTransactions = await getTransactionsByUserId(userId, 5)

// Lấy tất cả giao dịch (không giới hạn)
//const allTransactions = await getTransactionsByUserId(userId)



export const addTransaction = async (transactionData) => {
  const {
    user_id,
    amount,
    category_id,
    purpose_id,
    type,
    description,
    transaction_date,
  } = transactionData

  const query = `
    INSERT INTO transactions 
    (user_id, amount, category_id, purpose_id, type, description, transaction_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `

  const [result] = await db.execute(query, [
    user_id,
    amount,
    category_id,
    purpose_id || null,
    type,
    description,
    transaction_date,
  ])

  return result.insertId // trả về ID giao dịch mới
}