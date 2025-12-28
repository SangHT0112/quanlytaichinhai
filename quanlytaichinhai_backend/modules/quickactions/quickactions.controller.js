// controllers/quickactions.controller.js

import db from '../../config/db.js';
export const getQuickActions = async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user_id" });
    }

    // Lấy top 5 câu người dùng hay dùng nhất (theo tần suất và thời gian gần nhất)
    const [rows] = await db.query(`
        SELECT content, COUNT(*) AS freq, MAX(timestamp) AS latest
        FROM chat_histories
        WHERE user_id = ? AND role = 'user' AND LENGTH(content) > 4
        GROUP BY content
        ORDER BY freq DESC, latest DESC
        LIMIT 5
    `, [userId]);

    let quickActions = rows
      .map(r => (r.content || '').trim())
      .filter(c => c)
      .map(text => ({ text }));

    // Fallback mặc định nếu user chưa có lịch sử
    if (quickActions.length === 0) {
      quickActions = [
        { text: 'Thêm chi tiêu 50k ăn sáng' },
        { text: 'Xem chi tiêu hôm nay' },
        { text: 'Kiểm tra số dư' },
        { text: 'Lập kế hoạch mua xe' },
      ];
    }

    res.json(quickActions);
  } catch (err) {
    console.error("Lỗi AI Quick Actions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
