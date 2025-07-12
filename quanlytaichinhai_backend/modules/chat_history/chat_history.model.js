import db from "../../config/db.js";

export const saveChatHistory = async (userId, messages) => {
  if (!userId || !messages?.length) return null;

  const values = messages.map(msg => [
    userId,
    msg.id,
    msg.content,
    msg.role,
    new Date(msg.timestamp),
    JSON.stringify(msg.structured || null),
    JSON.stringify(msg.custom_content || null),
    msg.intent || null
  ]);

  try {
    await db.query(
      `INSERT INTO chat_histories 
        (user_id, message_id, content, role, timestamp, structured_data, custom_content, intent)
        VALUES ?`,
      [values] // 👈 cần truyền mảng lồng mảng
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử chat:", error);
    return false;
  }
};


export const getChatHistory = async (userId, limit = 20) => {
  if (!userId) return [];

  try {
    const [rows] = await db.execute(
      `SELECT 
         message_id as id,
         content,
         role,
         timestamp,
         structured_data as structured,
         custom_content,
         intent
       FROM chat_histories
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      structured: row.structured ? JSON.parse(row.structured) : null,
      custom_content: row.custom_content ? JSON.parse(row.custom_content) : null
    }));
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chat:", error);
    return [];
  }
};

export const clearChatHistory = async (userId) => {
  if (!userId) return false;

  try {
    await db.execute(
      'DELETE FROM chat_histories WHERE user_id = ?',
      [userId]
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa lịch sử chat:", error);
    return false;
  }
};