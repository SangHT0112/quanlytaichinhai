import db from "../../config/db.js";

export const saveChatHistory = async (userId, messages) => {
  if (!userId || !messages?.length) {
    console.error("Thiếu userId hoặc messages rỗng:", { userId, messages });
    return null;
  }

  const values = messages.map(msg => {
    if (!msg.message_id || !msg.content || !msg.role || !msg.timestamp) {
      console.error("Dữ liệu tin nhắn không hợp lệ:", msg);
      throw new Error("Dữ liệu tin nhắn không hợp lệ");
    }
    let structuredData = msg.structured_data || null;
    if (structuredData && typeof structuredData === 'object' && 'message' in structuredData && !('type' in structuredData)) {
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
        user_input = VALUES(user_input)`,
      [values]
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử chat:", error, { userId, messages });
    return false;
  }
};

export const getChatHistory = async (userId, limit = 20) => {
  // Strict check cho userId (phải là string hoặc number hợp lệ, tránh undefined/null)
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'number')) {
    console.error("userId không hợp lệ:", userId);
    return [];
  }

  // Coerce limit thành number an toàn
  const safeLimit = Number(limit) || 20;
  if (isNaN(safeLimit) || safeLimit <= 0) {
    console.error("limit không hợp lệ:", limit);
    return [];
  }

  // SQL query (không filter date ở đây, dùng getChatHistoryByDate nếu cần)
  const sql = `SELECT 
    message_id as id,
    content,
    role,
    timestamp,
    structured_data as structured,
    custom_content,
    image_url as imageUrl,
    intent,
    user_input
  FROM chat_histories
  WHERE user_id = ?
  ORDER BY timestamp ASC
  LIMIT ?`;

  try {
    // Debug log để trace params trước khi execute
    console.log('Executing getChatHistory with params:', { userId, limit: safeLimit });

    const [rows] = await db.execute(sql, [userId, safeLimit]);

    return rows.map(row => {
      try {
        let structured = row.structured ? JSON.parse(row.structured) : null;
        if (structured && typeof structured === 'object' && 'message' in structured && !('type' in structured)) {
          structured = { type: 'text', message: structured.message };
        }
        return {
          ...row,
          timestamp: new Date(row.timestamp),
          structured,
          custom_content: row.custom_content ? JSON.parse(row.custom_content) : null,
          imageUrl: row.image_url || undefined,
          user_input: row.user_input || undefined,
        };
      } catch (parseError) {
        console.error('Lỗi khi parse structured/custom_content:', parseError, { 
          structured: row.structured, 
          custom_content: row.custom_content 
        });
        return { 
          ...row, 
          structured: null, 
          custom_content: null, 
          timestamp: new Date(row.timestamp) 
        };
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chat:", error);
    return [];
  }
};

// Add getChatHistoryByDate if needed (đã có, giữ nguyên nhưng thêm safe check tương tự)
export const getChatHistoryByDate = async (userId, date, limit = 50) => {
  if (!userId || !date) {
    console.error("Thiếu userId hoặc date");
    return [];
  }

  const safeUserId = Number(userId);
  if (isNaN(safeUserId)) {
    console.error("userId không hợp lệ cho getChatHistoryByDate:", userId);
    return [];
  }

  const safeDate = new Date(date).toISOString().split("T")[0];
  const safeLimit = Number(limit) || 50;
  if (isNaN(safeLimit) || safeLimit <= 0) {
    console.error("limit không hợp lệ:", limit);
    return [];
  }

  // Xây dựng LIMIT clause mà không dùng ? (tránh bind error)
  const limitClause = `LIMIT ${safeLimit}`;

  const sql = `SELECT 
    message_id AS id,
    content,
    role,
    timestamp,
    structured_data AS structured,
    custom_content,
    image_url AS imageUrl,
    intent,
    user_input
  FROM chat_histories
  WHERE user_id = ? AND DATE(timestamp) = ?
  ORDER BY timestamp ASC
  ${limitClause}`;

  try {
    // Debug log
    console.log('Executing getChatHistoryByDate with params:', { safeUserId, safeDate, safeLimit });

    const [rows] = await db.execute(sql, [safeUserId, safeDate]);  // Chỉ 2 params

    return rows.map(row => {
      let structured = null;
      let custom_content = null;
      try {
        structured = row.structured ? JSON.parse(row.structured) : null;
        custom_content = row.custom_content ? JSON.parse(row.custom_content) : null;
      } catch (parseError) {
        console.error('Lỗi parse in getChatHistoryByDate:', parseError);
      }
      return {
        ...row,
        timestamp: new Date(row.timestamp),
        structured,
        custom_content,
      };
    });
  } catch (error) {
    console.error("🔥 Lỗi khi lấy lịch sử chat theo ngày:", error);
    console.log("➡️ Params:", { safeUserId, safeDate, safeLimit });
    return [];
  }
};