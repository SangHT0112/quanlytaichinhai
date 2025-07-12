import axiosInstance from "@/config/axios";

export async function saveChatHistory(userId: number, messages: any[]) {
  const res = await axiosInstance.post("/chat-history", {
    user_id: userId,
    messages: messages
  });
  return res.data;
}

export async function getChatHistory(userId: number, limit = 50) {
  const res = await axiosInstance.get("/chat-history", {
    params: {
      user_id: userId,
      limit: limit
    }
  });
  return res.data;
}

export async function clearChatHistory(userId: number) {
  const res = await axiosInstance.delete("/chat-history", {
    data: {
      user_id: userId
    }
  });
  return res.data;
}

// Hàm lấy lịch sử chat gần nhất (rút gọn)
export async function getRecentChatHistory(userId: number, limit = 5) {
  const res = await axiosInstance.get("/chat-history/recent", {
    params: {
      user_id: userId,
      limit: limit
    }
  });
  return res.data;
}