// controllers/quickactions.controller.js

import db from '../../config/db.js';
import { fetchWithFailover } from '../ai/utils/fetchWithFailover.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Định nghĩa __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getQuickActions = async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user_id" });
    }

    // Lấy 50 câu gần nhất từ user
    const [rows] = await db.query(`
        SELECT content, COUNT(*) AS freq
        FROM chat_histories
        WHERE user_id = ? AND role = 'user' AND LENGTH(content) > 10
        GROUP BY content
        ORDER BY freq DESC, MAX(timestamp) DESC
        LIMIT 50
    `, [userId]);

    const userMessages = rows.map(r => r.content).join('\n');

    const prompt = `
        Bạn là trợ lý tài chính cá nhân thông minh. Dưới đây là các câu chat gần đây của người dùng, được sắp xếp theo tần suất xuất hiện và thời gian gần đây nhất. Mỗi dòng là một câu chat riêng biệt:

        ${userMessages}

        Dựa trên lịch sử chat này và kiến thức về các ứng dụng quản lý tài chính, hãy suy luận 3-5 "quick actions" (hành động nhanh) mà người dùng có thể sẽ muốn thực hiện tiếp theo hoặc thường xuyên thực hiện. Các hành động này nên hữu ích, ngắn gọn, và có tính khả thi trong một ứng dụng tài chính.

        **Ví dụ về các loại quick actions hữu ích:**
        - **Ghi lại giao dịch:** "Thêm chi tiêu ăn sáng 25k", "Vừa đổ xăng 50k"
        - **Xem báo cáo/thống kê:** "Xem chi tiêu tháng này", "Biểu đồ thu chi", "Kiểm tra số dư hiện tại", "Báo cáo nợ"
        - **Lập kế hoạch/dự đoán:** "Dự đoán số dư cuối tháng", "Xem ngân sách còn lại", "Lập kế hoạch tiết kiệm"
        - **Quản lý mục tiêu/tài sản:** "Xem mục tiêu tiết kiệm", "Cập nhật tài sản"
        - **Các hành động phổ biến khác dựa trên xu hướng chat của người dùng.**

        **Quy tắc cần tuân thủ:**
        1.  **Phân tích tần suất và độ mới:** Ưu tiên các hành động liên quan đến các câu chat xuất hiện nhiều lần hoặc rất gần đây.
        2.  **Đa dạng hành động:** Cố gắng gợi ý các hành động thuộc các loại khác nhau (ghi chép, xem báo cáo, lập kế hoạch) nếu phù hợp với lịch sử chat.
        3.  **Không lặp lại:** Đảm bảo các quick actions được gợi ý là khác nhau.
        4.  **Hành động rõ ràng:** Mỗi quick action phải là một yêu cầu rõ ràng, có thể được thực hiện trực tiếp bởi hệ thống.
        5.  **Ngôn ngữ tự nhiên, ngắn gọn:** Ví dụ: "Thêm chi tiêu", "Xem báo cáo", "Kiểm tra số dư".

        Trả về một mảng JSON các đối tượng, mỗi đối tượng có khóa "text":
        [
        { "text": "Quick Action 1" },
        { "text": "Quick Action 2" },
        { "text": "Quick Action 3" }
        ]
        `;

    const aiResponse = await fetchWithFailover({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const aiText = aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    let quickActions = [];
    try {
      const jsonStart = aiText.indexOf('[');
      const jsonEnd = aiText.lastIndexOf(']') + 1;
      const jsonText = aiText.slice(jsonStart, jsonEnd);
      quickActions = JSON.parse(jsonText);
    } catch (e) {
      console.warn("⚠️ Không thể parse JSON từ Gemini:", aiText);
    }

    res.json(quickActions);
  } catch (err) {
    console.error("Lỗi AI Quick Actions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
