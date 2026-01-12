import db from "../../config/db.js";

// ======================== LẤY GIAO DỊCH NGƯỜI DÙNG ========================
export const getTransactionsByUserId = async (userId, limit = 50) => {
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
  `;

  const params = [Number(userId)];

  const safeLimit = Number(limit);

  if (!Number.isInteger(safeLimit) || safeLimit <= 0) {
    // fallback an toàn
    query += " LIMIT 50";
  } else {
    query += " LIMIT ?";
    params.push(safeLimit);
  }

  const [rows] = await db.execute(query, params);

  return rows.map((t) => ({
    id: t.transaction_id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category_name || "Không rõ",
    icon: t.category_icon || (t.type === "income" ? "💰" : "💸"),
    date: t.transaction_date,
  }));
};


// ======================== THÊM GIAO DỊCH ========================
export const addTransaction = async (transactionData) => {
  const {
    user_id,
    amount,
    category_id,
    purpose_id,
    type,
    description,
    transaction_date,
    group_id,
  } = transactionData;

  const query = `
    INSERT INTO transactions 
    (user_id, amount, category_id, purpose_id, type, description, 
     transaction_date, group_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await db.execute(query, [
    Number(user_id),
    Number(amount),
    category_id || null,
    purpose_id || null,
    type,
    description,
    transaction_date,
    group_id || null,
  ]);

  return result.insertId;
};

// ======================== TẠO NHÓM GIAO DỊCH ========================
export const createTransactionGroup = async (groupData) => {
  const query = `
    INSERT INTO transaction_groups 
    (user_id, group_name, total_amount, transaction_date)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    Number(groupData.user_id),
    groupData.group_name,
    Number(groupData.total_amount),
    groupData.transaction_date,
  ]);
  return result.insertId;
};

// ======================== LẤY NHÓM GIAO DỊCH ========================
export const getTransactionGroupsByUserId = async (
  userId,
  limit = 10,
  offset = 0,
  dateFilter = null
) => {
  let query = `
    SELECT 
      tg.group_id,
      tg.group_name,
      tg.transaction_date,
      tg.created_at,
      COUNT(t.transaction_id) AS transaction_count,
      COALESCE(SUM(
        CASE 
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      ), 0) AS total_amount
    FROM transaction_groups tg
    LEFT JOIN transactions t ON tg.group_id = t.group_id
    WHERE tg.user_id = ?
  `;

  const params = [Number(userId)];

  // Lọc ngày
  if (dateFilter === "today") {
    query += ` AND DATE(tg.transaction_date) = CURDATE()`;
  } else if (dateFilter === "yesterday") {
    query += ` AND DATE(tg.transaction_date) = CURDATE() - INTERVAL 1 DAY`;
  } else if (dateFilter && dateFilter.startsWith("last_") && dateFilter.endsWith("_days")) {
    // Hỗ trợ "last_N_days" (ví dụ: "last_3_days")
    // Bao gồm từ hôm nay trở về N-1 ngày trước (tổng N ngày)
    const daysMatch = dateFilter.match(/last_(\d+)_days/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      if (days > 0) {
        query += ` AND DATE(tg.transaction_date) >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND DATE(tg.transaction_date) <= CURDATE()`;
        params.push(days - 1); // N-1 ngày trước (ví dụ: 3 ngày = hôm nay + 2 ngày trước)
      }
    }
  } else if (/\d{4}-\d{2}-\d{2}/.test(dateFilter)) {
    query += ` AND DATE(tg.transaction_date) = ?`;
    params.push(dateFilter);
  }

  query += `
    GROUP BY tg.group_id, tg.group_name, tg.transaction_date, tg.created_at
    ORDER BY tg.transaction_date DESC
  `;
 const safeLimit = Number(limit);
  const safeOffset = Number(offset);

  let limitOffsetClause = '';
  let finalParams = [...params];  // Copy params hiện tại (có thể có date nếu có)

  if (!isNaN(safeLimit) && !isNaN(safeOffset)) {
    limitOffsetClause = ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;  // Nội suy
  } else if (!isNaN(safeLimit)) {
    limitOffsetClause = ` LIMIT ${safeLimit}`;
  }

  query += limitOffsetClause;

  const [rows] = await db.execute(query, finalParams);  // Không push LIMIT/OFFSET vào params
  return rows;
};

// ======================== LẤY GIAO DỊCH THEO NHÓM ========================
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

  const [rows] = await db.execute(query, [Number(groupId)]);
  return rows;
};

// ======================== LẤY GIAO DỊCH GẦN NHẤT ========================
export const getRecentTransactionsByUserId = async (
  userId,
  limit = 5,
  offset = 0
) => {
  const query = `
    SELECT 
      t.transaction_id AS id,
      t.description,
      t.amount,
      t.type,
      t.created_at
    FROM transactions t
    INNER JOIN transaction_groups tg ON t.group_id = tg.group_id
    WHERE tg.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.execute(query, [
    Number(userId),
    Number(limit),
    Number(offset),
  ]);
  return rows;
};



// Thêm vào transaction.model.js (hàm mới, không ảnh hưởng code cũ)

export const getGroupedTransactionsByUserId = async (userId, categoryId = null, limit = null) => {
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
  `;

  const params = [Number(userId)];

  if (categoryId) {
    query += ` AND t.category_id = ?`;
    params.push(Number(categoryId));
  }

  query += ` ORDER BY t.transaction_date DESC`;

  const safeLimit = Number(limit);
  if (!isNaN(safeLimit) && safeLimit > 0) {
    query += " LIMIT ?";
    params.push(safeLimit);
  }

  const [rows] = await db.execute(query, params);

  // Nhóm theo category ngay tại model để tối ưu
  const grouped = rows.reduce((acc, t) => {
    const catName = t.category_name || "Không rõ";
    const catIcon = t.category_icon || (t.type === "income" ? "💰" : "💸");
    if (!acc[catName]) {
      acc[catName] = { icon: catIcon, items: [] };
    }
    acc[catName].items.push({
      id: t.transaction_id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      date: t.transaction_date,
    });
    return acc;
  }, {});

  return grouped;
};

export const deleteAllTransactionsByUser = async (user_id) => {
  const result = await db.query('DELETE FROM transactions WHERE user_id = ?', [user_id]);
  // Xóa groups nếu có liên kết
  await db.query('DELETE FROM transaction_groups WHERE user_id = ?', [user_id]);
  return result.affectedRows || 0;
};