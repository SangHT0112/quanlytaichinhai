import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback schema cơ bản (nếu file mất)
const FALLBACK_SCHEMA = `
-- Bảng transactions
CREATE TABLE transactions (
  transaction_id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(15,2),
  category_id INT,
  type ENUM('income', 'expense'),
  description TEXT,
  transaction_date DATETIME,
  group_id INT
);

-- Bảng categories (user_id có thể NULL cho global)
CREATE TABLE categories (
  category_id INT PRIMARY KEY,
  user_id INT NULL,  -- NULL cho global categories
  name VARCHAR(255),
  type ENUM('income', 'expense'),
  parent_id INT
);

-- Bảng transaction_groups
CREATE TABLE transaction_groups (
  group_id INT PRIMARY KEY,
  user_id INT,
  group_name VARCHAR(255),
  total_amount DECIMAL(15,2),
  transaction_date DATE
);
`;

export const generateSQLPrompt = ({ user_id, user_input, historyText = "" }) => {
  const schemaPath = path.join(__dirname, "../../documents/db_schema.txt");
  
  let schemaText;
  try {
    schemaText = fs.readFileSync(schemaPath, "utf-8");
  } catch (error) {
    console.error("Lỗi đọc schema:", error);
    schemaText = FALLBACK_SCHEMA;  // Dùng fallback
    console.warn("Sử dụng fallback schema");
  }

  // Truncate history nếu quá dài
  const truncatedHistory = historyText.length > 500 ? historyText.substring(0, 500) + "..." : historyText;
  const historyPrompt = truncatedHistory ? `xem lịch sử gần đây: "${truncatedHistory}"` : "Không có lịch sử cần xem.";

  // Escape user_input để tránh break string (thay " thành &quot;)
  const escapedInput = user_input.replace(/"/g, '&quot;');

  return `
Dưới đây là schema cơ sở dữ liệu tài chính cá nhân:
${schemaText}

Yêu cầu:
- Viết một câu truy vấn **MySQL** phù hợp với câu hỏi của người dùng bên dưới.
- **Chỉ được sử dụng truy vấn dạng SELECT** để truy xuất dữ liệu.
- Gắn điều kiện \`user_id = ${user_id}\` nếu có liên quan (trên transactions, transaction_groups, hoặc categories nếu không phải global).
- **Xử lý global categories: Nếu categories.user_id là NULL (global categories, áp dụng cho mọi user), dùng (C.user_id IS NULL OR C.user_id = ${user_id}) để match chính xác, tránh loại bỏ global data.**
- Nếu người dùng đề cập đến nội dung mô tả giao dịch (ví dụ: "ăn phở", "đổ xăng", "mua áo", "đóng tiền điện", "mua thịt heo", "mua rau"...), thì tìm trong trường "description" của bảng "transactions", **KHÔNG tìm trong "categories.name" hoặc "group_name"**.
- **Xử lý transaction_groups (nếu user đề cập tên nhóm như "đi chợ", "tiền ăn", hoặc từ khóa gợi ý nhóm giao dịch):**
  - Ưu tiên truy vấn bảng transaction_groups với WHERE G.user_id = ${user_id} AND G.group_name LIKE '%từ_khóa_trong_user_input%'.
  - Nếu hỏi tổng tiền nhóm: SELECT COALESCE(SUM(G.total_amount), 0) AS total FROM transaction_groups G WHERE ... (thêm filter thời gian nếu có, ví dụ MONTH/G.transaction_date = MONTH(CURRENT_DATE())).
  - Nếu hỏi chi tiết giao dịch trong nhóm: JOIN với transactions: SELECT T.description, T.amount, T.transaction_date FROM transactions T JOIN transaction_groups G ON T.group_id = G.group_id WHERE G.user_id = ${user_id} AND G.group_name LIKE '%đi chợ%' AND ... ORDER BY T.transaction_date DESC LIMIT 10.
  - Luôn filter thời gian nếu user chỉ định (tháng/năm/ngày) qua MONTH/YEAR(transaction_date) hoặc DATE(transaction_date).
- **Nếu hỏi tổng chi tiêu/thu nhập tháng này (không chỉ định category hoặc group), dùng SUM(amount) với WHERE type='expense' (hoặc 'income') và filter MONTH/YEAR(transaction_date)=MONTH/YEAR(CURRENT_DATE()), KHÔNG cần JOIN categories. Thêm COALESCE(SUM(amount), 0) để tránh NULL. Nếu có groups liên quan, ưu tiên SUM từ transaction_groups.total_amount.**
- Nếu người dùng hỏi về thống kê chi tiêu theo category (ví dụ: "ăn uống", "di chuyển"), JOIN categories ON category_id, filter categories.name=..., type='expense', và dùng (C.user_id IS NULL OR C.user_id = ${user_id}).
- Nếu người dùng hỏi về thống kê chi tiêu nhiều nhất, cần:
  - Trả về tổng tiền chi tiêu cho nhóm giao dịch có liên quan (ví dụ: ăn uống hoặc nhóm "đi chợ").
  - Có thể liệt kê chi tiết các giao dịch nếu cần (dùng LIMIT 5-10), ưu tiên từ transactions hoặc groups tùy ngữ cảnh.
- Ví dụ SQL cho tổng lương tháng này (income 'Lương'): SELECT COALESCE(SUM(T.amount), 0) FROM transactions AS T JOIN categories AS C ON T.category_id = C.category_id WHERE T.user_id = ${user_id} AND (C.user_id IS NULL OR C.user_id = ${user_id}) AND C.name = 'Lương' AND T.type = 'income' AND MONTH(T.transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(T.transaction_date) = YEAR(CURRENT_DATE());
- Ví dụ SQL cho tổng "đi chợ" tháng này: SELECT COALESCE(SUM(G.total_amount), 0) FROM transaction_groups AS G WHERE G.user_id = ${user_id} AND G.group_name LIKE '%đi chợ%' AND MONTH(G.transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(G.transaction_date) = YEAR(CURRENT_DATE());
- Trả về **chỉ nội dung SQL**, không giải thích, không ghi chú, không thêm bất kỳ văn bản nào khác.
- Nếu không thể viết SQL hợp lệ, hãy trả về đúng chuỗi: **"INVALID_SQL"**
Câu hỏi người dùng: "${escapedInput}"
${historyPrompt ? `\nLịch sử tham khảo: ${historyPrompt}` : ''}
`.trim();
};