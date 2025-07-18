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
    group_id
  } = transactionData;

  const query = `
    INSERT INTO transactions 
    (user_id, amount, category_id, purpose_id, type, description, 
     transaction_date, group_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await db.execute(query, [
    user_id,
    amount,
    category_id,
    purpose_id || null,
    type,
    description,
    transaction_date,
    group_id || null
  ]);

  return result.insertId;
}


export const createTransactionGroup = async (groupData) => {
  const query = `
    INSERT INTO transaction_groups 
    (user_id, group_name, total_amount, transaction_date)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    groupData.user_id,
    groupData.group_name,
    groupData.total_amount,
    groupData.transaction_date
  ]);
  return result.insertId;
}

// lấy các giao dịch trong 1 thời gian yêu cầu
export const getTransactionGroupsByUserId = async (userId, limit = null, dateFilter = null) => {
  let query = `
    SELECT 
      tg.group_id,
      tg.group_name,
      tg.total_amount,
      tg.transaction_date,
      COUNT(t.transaction_id) AS transaction_count
    FROM transaction_groups tg
    LEFT JOIN transactions t ON tg.group_id = t.group_id
    WHERE tg.user_id = ?
  `;

  const params = [userId];

  // Xử lý lọc theo ngày
  if (dateFilter === "today") {
    query += ` AND DATE(tg.transaction_date) = CURDATE()`;
  } else if (dateFilter === "yesterday") {
    query += ` AND DATE(tg.transaction_date) = CURDATE() - INTERVAL 1 DAY`;
  } else if (/\d{4}-\d{2}-\d{2}/.test(dateFilter)) {
    query += ` AND DATE(tg.transaction_date) = ?`;
    params.push(dateFilter);
  }

  query += `
    GROUP BY tg.group_id
    ORDER BY tg.transaction_date DESC
  `;

  if (limit && Number.isInteger(limit)) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  const [rows] = await db.execute(query, params);
  return rows;
};

//lấy các chi tiết giao dịch trong 1 nhóm yêu cầu
export const getTransactionsByGroupId = async (groupId) => {
  const query = `
    SELECT 
      t.*,
      c.name AS category_name,
      c.icon AS category_icon
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.category_id
    WHERE t.group_id = ?
    ORDER BY t.transaction_date DESC
  `;
  
  const [rows] = await db.execute(query, [groupId]);
  return rows;
}

