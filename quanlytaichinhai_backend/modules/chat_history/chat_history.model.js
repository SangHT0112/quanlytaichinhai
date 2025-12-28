import db from "../../config/db.js";

/* ============================================
   SAVE CHAT HISTORY
============================================ */
export const saveChatHistory = async (userId, messages) => {
  if (!userId || !messages?.length) return null;

  const values = messages.map(msg => {
    let structuredData = msg.structured_data || null;

    if (structuredData &&
        typeof structuredData === 'object' &&
        'message' in structuredData &&
        !('type' in structuredData)) {
      structuredData = { type: 'text', message: structuredData.message };
    }

    return [
      userId,
      msg.message_id,
      msg.content,
      msg.role,
      new Date(msg.timestamp),
      JSON.stringify(structuredData),
      JSON.stringify(msg.custom_content || null),
      msg.image_url || null,
      msg.intent || null,
      msg.user_input || null,
    ];
  });

  try {
    await db.query(
      `INSERT INTO chat_histories 
        (user_id, message_id, content, role, timestamp, structured_data, custom_content, image_url, intent, user_input)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          role = VALUES(role),
          timestamp = VALUES(timestamp),
          structured_data = VALUES(structured_data),
          custom_content = VALUES(custom_content),
          image_url = VALUES(image_url),
          intent = VALUES(intent),
          user_input = VALUES(user_input)
      `,
      [values]
    );

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử chat:", error);
    return false;
  }
};


/* ============================================
   GET CHAT HISTORY
============================================ */
export const getChatHistory = async (userId, limit = 20) => {
  if (!userId) return [];

  const safeLimit = Number(limit);
  const finalLimit = safeLimit > 0 ? safeLimit : 20;

  const sql = `
    SELECT 
      message_id AS id,
      content,
      role,
      timestamp,
      structured_data,
      custom_content,
      image_url AS imageUrl,
      intent,
      user_input
    FROM chat_histories
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  try {
    const [rows] = await db.execute(sql, [userId, finalLimit]);

    return rows.map(row => {
      let structured = null;
      let custom = null;

      try {
        structured = row.structured_data ? JSON.parse(row.structured_data) : null;
        custom = row.custom_content ? JSON.parse(row.custom_content) : null;
      } catch (err) {
        console.error("Parse JSON error:", err);
      }

      return {
        id: row.id,
        content: row.content,
        role: row.role,
        timestamp: new Date(row.timestamp),
        structured,
        custom_content: custom,
        imageUrl: row.imageUrl || null,
        intent: row.intent || null,
        user_input: row.user_input || null,
      };
    });
  } catch (error) {
    console.error("Lỗi getChatHistory:", error);
    return [];
  }
};


/* ============================================
   GET CHAT HISTORY BY DATE
============================================ */
export const getChatHistoryByDate = async (userId, date, limit = 50) => {
  if (!userId || !date) return [];

  const safeLimit = Number(limit) > 0 ? Number(limit) : 50;

  const sql = `
    SELECT 
      message_id AS id,
      content,
      role,
      timestamp,
      structured_data,
      custom_content,
      image_url AS imageUrl,
      intent,
      user_input
    FROM chat_histories
    WHERE user_id = ? 
      AND DATE(timestamp) = ?
    ORDER BY timestamp DESC
    LIMIT ${safeLimit}
  `;

  try {
    const [rows] = await db.execute(sql, [userId, date]);

    return rows.map(row => ({
      id: row.id,
      content: row.content,
      role: row.role,
      timestamp: new Date(row.timestamp),
      structured: row.structured_data ? JSON.parse(row.structured_data) : null,
      custom_content: row.custom_content ? JSON.parse(row.custom_content) : null,
      imageUrl: row.imageUrl || null,
      intent: row.intent || null,
      user_input: row.user_input || null,
    }));

  } catch (error) {
    console.error("Lỗi getChatHistoryByDate:", error);
    return [];
  }
};
