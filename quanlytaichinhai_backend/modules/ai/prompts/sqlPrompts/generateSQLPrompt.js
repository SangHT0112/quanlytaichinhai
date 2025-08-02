import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateSQLPrompt = ({ user_id, user_input, historyText }) => {
  const schemaPath = path.join(__dirname, "../../documents/db_schema.txt");
  const schemaText = fs.readFileSync(schemaPath, "utf-8");

  return `
Dưới đây là schema cơ sở dữ liệu tài chính cá nhân:
${schemaText}

Yêu cầu:
- Viết một câu truy vấn **MySQL** phù hợp với câu hỏi của người dùng bên dưới.
- **Chỉ được sử dụng truy vấn dạng SELECT** để truy xuất dữ liệu.
- Gắn điều kiện \`user_id = ${user_id}\` nếu có liên quan.
- Nếu người dùng đề cập đến nội dung mô tả giao dịch (ví dụ: "ăn phở", "đổ xăng", "mua áo", "đóng tiền điện"...), thì nên tìm trong trường "description" của bảng "transactions", **KHÔNG tìm trong "categories.name"**.
- Nếu người dùng hỏi về thống kê chi tiêu nhiều nhất, cần:
  - Trả về tổng tiền chi tiêu cho nhóm giao dịch có liên quan (ví dụ: ăn uống).
  - Có thể liệt kê chi tiết các giao dịch nếu cần.
- Trả về **chỉ nội dung SQL**, không giải thích, không ghi chú, không thêm bất kỳ văn bản nào khác.
- Nếu không thể viết SQL hợp lệ, hãy trả về đúng chuỗi: **"INVALID_SQL"**
- Nếu người dùng có biểu hiện hỏi lại những tin nhắn trước đó thì xem ${historyText} để viết.
Câu hỏi người dùng: "${user_input}"
`.trim();
};
