import { getCategory } from "../../category/category.model.js";
import { getCurrencyMappings } from "../../currency/currency.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateTransactionPrompt = async ({ user_input, now, user_id }) => {
  const hintPath = path.join(__dirname, "../train_documents/transactionTrainDocs.txt");
  const trainDocs = fs.readFileSync(hintPath, "utf-8");

  const categories = await getCategory();
  const categoryList = categories.join(", ");

  const currencyMappings = await getCurrencyMappings();
  const currencyPrompt = currencyMappings
    .map((c) => `${c.term} = ${c.amount} ${c.currency_code}`)
    .join(", ");

  // Kiểm tra xem user_input có chứa số tiền hay không (bao gồm cả số đứng một mình)
  const moneyPattern = /\b(\d+(?:[.,]\d+)?)(\s*(tỷ|triệu|nghìn|ngàn|k|tr|củ|xị|chai|lít|cây|vé))?\b/gi;
  const hasMoney = moneyPattern.test(user_input) || /\b\d+(?:\.\d+)?\b/.test(user_input);

  if (!hasMoney) {
    return `
{
  "response_type": "natural",
  "message": "Bạn ơi, mình chưa thấy số tiền nào trong câu này. Bạn có thể nói rõ hơn được không? Ví dụ như bạn chi bao nhiêu hay nhận được bao nhiêu?"
}
    `;
  }

  return `
Bạn là một trợ lý tài chính cá nhân thông minh, nhiệm vụ là trích xuất các giao dịch tài chính từ đoạn văn người dùng cung cấp, kể cả khi câu đầu vào không rõ ràng hoặc chỉ chứa các con số.

📌 CÂU ĐẦU VÀO:
"${user_input}"

📌 YÊU CẦU:
- Trích xuất chính xác **các giao dịch** (có thể là một hoặc nhiều) từ câu đầu vào.
- Nếu câu có chứa từ khóa như "lương", "thưởng", "thu nhập", "nhận tiền" → gán "type" là "income".
- Nếu câu có chứa từ khóa như "mua", "chi", "trả", "ăn", "uống", "đi" → gán "type" là "expense".
- Nếu không rõ là "income" hay "expense" → mặc định là "expense".
- **group_name**: 
  - Nếu nhận diện được ngữ cảnh (ví dụ: "Đi chợ", "Mua sắm", "Ăn sáng", "Đi cafe"), sử dụng cụm từ phù hợp.
  - Nếu không tìm thấy ngữ cảnh cụ thể → tóm tắt ngắn gọn ý nghĩa của câu đầu vào hoặc dùng "${user_input}" làm "group_name".
  - Đối với hóa đơn định kỳ (như điện, nước, internet, thuê nhà), chỉ trả về một giao dịch duy nhất với mô tả là loại dịch vụ tương ứng.
- **transaction_date**: 
  - Nếu không có ngày cụ thể → dùng "${now}".
  - Nếu có cụm như "hôm qua", "3 ngày trước", "tuần trước", "tháng trước", "2 tuần trước", "đầu tháng", "cuối tháng", "ngày 12/7", "12 tháng 7" → phân tích ngày tương ứng dựa trên "${now}".
- **total_amount**: Tổng số tiền của tất cả giao dịch (nếu có nhiều giao dịch).
- Nếu câu chỉ chứa các con số rời rạc (ví dụ: "1000 12 5 6667") và không rõ ngữ cảnh:
  - Coi mỗi số là một giao dịch riêng biệt.
  - Gán "type" là "expense" và "category" là "Khác" (nếu "Khác" có trong danh sách category).
  - Mô tả mặc định là "Giao dịch không xác định".

📌 ĐỊNH DẠNG PHẢI TRẢ VỀ (JSON CHUẨN):
{
  "group_name": "Tên nhóm, ví dụ: Đi chợ, Mua sắm, Ăn sáng, Đi cafe, Lãnh lương",
  "transaction_date": "${now}",
  "user_id": ${user_id},
  "total_amount": số tiền tổng cộng của giao dịch (nếu có nhiều giao dịch thì là tổng của tất cả),
  "transactions": [
    {
      "type": "expense" hoặc "income",
      "amount": số tiền (VD: 75000),
      "category": "chỉ chọn từ danh sách: [${categoryList}]",
      "description": "mô tả giao dịch, ví dụ: mua sắm tại siêu thị, ăn sáng tại quán A, lãnh lương tháng 8"
    }
  ]
}

📌 Tài liệu cần học để rút kinh nghiệm:
${trainDocs}

📌 QUY TẮC BẮT BUỘC:
- Trả về đúng định dạng JSON. **Không thêm lời giải thích.**
- "amount" phải là số, hiểu đúng các cách nói dân gian: ${currencyPrompt}
- Nếu câu chỉ chứa số (VD: "1000 12 5") → mỗi số là một giao dịch riêng, category là "Khác" (nếu có), description là "Giao dịch không xác định".
- "category" chỉ được chọn từ danh sách: [${categoryList}].
- "transaction_date" mặc định là "${now}" nếu không đề cập.
- "description" mô tả ngắn gọn giao dịch, ưu tiên sử dụng từ khóa trong câu đầu vào.
- Nếu không rõ ngữ cảnh, dùng "Khác" làm category và tóm tắt câu đầu vào làm description.

📌 LƯU Ý:
- Chỉ in JSON, không thêm giải thích hay lời nói nào.
- Xử lý trường hợp đặc biệt như "lãnh lương 100 triệu" → type: "income", category: "Lương" (nếu có trong danh sách).
- Nếu câu nhập không rõ ràng (VD: "1000 12 5 6667") → tạo giao dịch riêng cho mỗi số, category là "Khác".
  `;
};