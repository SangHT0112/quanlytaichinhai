// models/quickactions.model.js
import db from "../../config/db.js";

/**
 * Lấy các câu chat của user (role: 'user') xuất hiện nhiều nhất
 * @param {number} userId
 * @param {number} limit - số lượng câu muốn lấy
 */
export const getFrequentUserMessages = async (userId, limit = 5) => {
  const [rows] = await db.query(
    `
    SELECT content, COUNT(*) AS freq
    FROM chat_histories
    WHERE user_id = ? AND role = 'user' AND LENGTH(content) > 10
    GROUP BY content
    ORDER BY freq DESC, MAX(timestamp) DESC
    LIMIT ?;
    `,
    [userId, limit]
  );

  return rows;
};
