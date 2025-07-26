import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateForecastSQLPrompt = ({ user_input, user_id }) => {
  const schemaPath = path.join(__dirname, "../../documents/db_schema.txt");
  const schemaText = fs.readFileSync(schemaPath, "utf-8");

  return `
Dưới đây là schema cơ sở dữ liệu tài chính cá nhân:
${schemaText}

Yêu cầu:
- Nhiệm vụ của bạn là tạo kế hoạch tài chính tiết kiệm dựa trên câu nói của người dùng.
- Nếu người dùng nói về việc **mua một món đồ trong tương lai** (ví dụ: "mua laptop 35 triệu", "tiết kiệm 50 triệu trong bao lâu"), bạn cần:
  1. Trích số tiền mục tiêu (goal_amount)
  2. Viết truy vấn **MySQL** tính **tổng trung bình thu nhập và chi tiêu trong 3 tháng gần nhất** của \`user_id = ${user_id}\`
  3. Tính trung bình tiết kiệm mỗi tháng từ thu - chi

- Trả về JSON theo định dạng sau:
{
  "goal_amount": 35000000,
  "sql": "SELECT ...;"
}

- Lưu ý:
  - Nếu không trích được goal_amount thì để là null
  - Nếu không thể viết SQL hợp lệ thì trả về đúng chuỗi: **"INVALID_FORECAST"**
  - **Không được thêm bất kỳ ghi chú, markdown hoặc giải thích nào khác**

Câu hỏi của người dùng: "${user_input}"
`.trim();
};
