// src/handlers/historyManager.js
import { getChatHistory } from '../../models/chatHistoryModel.js';

const formatMessage = (msg) => {
  if (msg.role === "user") {
    return `Người dùng: ${msg.content}`;
  }
  
  const structuredText = msg.structured 
    ? `\n(JSON: ${JSON.stringify(msg.structured)})` 
    : "";
  return `AI: ${msg.content}${structuredText}`;
};

export const getFormattedHistory = async (user_id, limit = 5) => {
  if (!user_id) return "";
  
  try {
    const history = await getChatHistory(user_id, limit);
    return history.map(formatMessage).join("\n");
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chat:", error);
    return "";
  }
};