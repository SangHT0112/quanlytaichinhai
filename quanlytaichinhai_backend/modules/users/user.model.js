import db from "../../config/db.js";

// Lấy tất cả người dùng
export async function getAllUsers() {
  const sql = `
    SELECT 
      user_id, 
      username, 
      email,
      role,
      status,
      last_active_at,
      created_at, 
      updated_at
    FROM users
    ORDER BY created_at DESC
  `;
  const [rows] = await db.execute(sql);
  return rows;
}

// Cập nhật quyền của user
export async function updateUserRole(userId, role) {
  const sql = `UPDATE users SET role = ? WHERE user_id = ?`;
  const [result] = await db.execute(sql, [role, userId]);
  return result;
}
