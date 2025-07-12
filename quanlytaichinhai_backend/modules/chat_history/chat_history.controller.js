import {
  saveChatHistory,
  getChatHistory,
  clearChatHistory
} from "./chat_history.model.js";

export const saveHistory = async (req, res) => {
  const { user_id} = req.body;
  const { messages } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Định dạng messages không hợp lệ" });
  }

  const result = await saveChatHistory(user_id, messages);
  
  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Lỗi khi lưu lịch sử chat" });
  }
};

export const getHistory = async (req, res) => {
  const { user_id, limit } = req.query;
  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  try {
    const history = await getChatHistory(user_id, parseInt(limit) || 50);
    res.json(history);
  } catch (error) {
    console.error("Lỗi controller getHistory:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chat" });
  }
};

export const deleteHistory = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Thiếu user_id" });

  const result = await clearChatHistory(user_id);
  
  if (result) {
    res.json({ success: true, message: "Đã xóa lịch sử chat" });
  } else {
    res.status(500).json({ error: "Lỗi khi xóa lịch sử chat" });
  }
};

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