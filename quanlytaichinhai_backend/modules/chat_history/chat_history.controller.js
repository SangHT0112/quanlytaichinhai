import {
  saveChatHistory,
  getChatHistory,
  getChatHistoryByDate 
} from "./chat_history.model.js";
import db from "../../config/db.js";

export const saveHistory = async (req, res) => {
  const { user_id, messages } = req.body;

  if (!user_id || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Thiếu user_id hoặc messages không hợp lệ" });
  }

  const isValidMessages = messages.every(msg => 
    msg.message_id && 
    msg.content && 
    msg.role && 
    msg.timestamp &&
    ['user', 'assistant'].includes(msg.role)
  );

  if (!isValidMessages) {
    return res.status(400).json({ error: "Dữ liệu tin nhắn không hợp lệ" });
  }

  const result = await saveChatHistory(user_id, messages);
  
  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Lỗi khi lưu lịch sử chat" });
  }
};

export const getHistory = async (req, res) => {
  const { user_id, limit, date } = req.query;
  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  try {
    let history;
    if (date) {
      // Filter by date if provided
      history = await getChatHistoryByDate(user_id, date, parseInt(limit) || 50);
    } else {
      history = await getChatHistory(user_id, parseInt(limit) || 50);
    }
    res.json(history);
  } catch (error) {
    console.error("Lỗi controller getHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chat" });
  }
};

// export const deleteHistory = async (req, res) => {
//   const { user_id } = req.body;
//   if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

//   const result = await clearChatHistory(user_id);
  
//   if (result) {
//     res.json({ success: true, message: "Đã xóa lịch sử chat" });
//   } else {
//     res.status(500).json({ error: "Lỗi khi xóa lịch sử chat" });
//   }
// };

export const getRecentHistory = async (req, res) => {
  const { user_id, limit } = req.query;
  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  try {
    const history = await getChatHistory(user_id, parseInt(limit) || 5);
    res.json(history);
  } catch (error) {
    console.error("Lỗi controller getRecentHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chat gần nhất" });
  }
};

// New function to filter by date
// export const getChatHistoryByDate = async (userId, date, limit = 50) => {
//   if (!userId || !date) {
//     console.error("Thiếu userId hoặc date");
//     return [];
//   }

//   try {
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(date);
//     endOfDay.setHours(23, 59, 59, 999);

//     const [rows] = await db.execute(
//       `SELECT 
//          message_id as id,
//          content,
//          role,
//          timestamp,
//          structured_data as structured,
//          custom_content,
//          image_url as imageUrl,
//          intent,
//          user_input
//        FROM chat_histories
//        WHERE user_id = ? AND timestamp BETWEEN ? AND ?
//        ORDER BY timestamp ASC
//        LIMIT ?`,
//       [userId, startOfDay, endOfDay, limit]
//     );

//     return rows.map(row => {
//       try {
//         let structured = row.structured ? JSON.parse(row.structured) : null;
//         if (structured && typeof structured === 'object' && 'message' in structured && !('type' in structured)) {
//           structured = { type: 'text', message: structured.message };
//         }
//         return {
//           ...row,
//           timestamp: new Date(row.timestamp),
//           structured,
//           custom_content: row.custom_content ? JSON.parse(row.custom_content) : null,
//           imageUrl: row.image_url || undefined,
//           user_input: row.user_input || undefined,
//         };
//       } catch (parseError) {
//         console.error('Lỗi khi parse structured/custom_content:', parseError, { structured: row.structured, custom_content: row.custom_content });
//         return { ...row, structured: null, custom_content: null, timestamp: new Date(row.timestamp) };
//       }
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy lịch sử chat theo ngày:", error);
//     return [];
//   }
// };

export const getTodayHistory = async (req, res) => {
  const { user_id, limit } = req.query;
  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

  try {
    const history = await getChatHistoryByDate(user_id, today, parseInt(limit) || 50);
    res.json(history);
  } catch (error) {
    console.error("Lỗi controller getTodayHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chat hôm nay" });
  }
};
