import {
  saveChatHistory,
  getChatHistory,
  getChatHistoryByDate
} from "./chat_history.model.js";

export const saveHistory = async (req, res) => {
  const { user_id, messages } = req.body;

  if (!user_id || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Thiếu user_id hoặc messages không hợp lệ" });
  }

  const ok = messages.every(msg =>
    msg.message_id &&
    msg.content &&
    msg.role &&
    msg.timestamp &&
    ["user", "assistant"].includes(msg.role)
  );

  if (!ok)
    return res.status(400).json({ error: "Dữ liệu tin nhắn không hợp lệ" });

  const result = await saveChatHistory(user_id, messages);
  if (result) res.json({ success: true });
  else res.status(500).json({ error: "Lỗi khi lưu lịch sử chat" });
};


export const getHistory = async (req, res) => {
  const { user_id, limit, date } = req.query;
  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  try {
    const history = date
      ? await getChatHistoryByDate(user_id, date, limit)
      : await getChatHistory(user_id, limit);

    res.json(history);

  } catch (error) {
    console.error("Lỗi getHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chat" });
  }
};


export const getRecentHistory = async (req, res) => {
  const { user_id, limit } = req.query;

  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  try {
    const history = await getChatHistory(user_id, limit || 5);
    res.json(history);
  } catch (error) {
    console.error("Lỗi getRecentHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chat gần nhất" });
  }
};


export const getTodayHistory = async (req, res) => {
  const { user_id, limit } = req.query;

  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  const today = new Date().toISOString().split("T")[0];

  try {
    const history = await getChatHistoryByDate(user_id, today, limit);
    res.json(history);
  } catch (error) {
    console.error("Lỗi getTodayHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử hôm nay" });
  }
};
