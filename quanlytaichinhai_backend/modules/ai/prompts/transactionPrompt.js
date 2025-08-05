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
  .map(c => `${c.term} = ${c.amount} ${c.currency_code}`)
  .join(", ");
  console.log(currencyPrompt)
  // Kiểm tra xem user_input có chứa số tiền hay không
  const moneyPattern = /\b(\d+(?:[.,]\d+)?)(\s*(tỷ|triệu|nghìn|ngàn|k|tr|củ|xị|chai|lít|cây|vé))\b/gi;

  const hasMoney = moneyPattern.test(user_input);

  if (!hasMoney) {
    return `
Bạn là một trợ lý tài chính thân thiện. Người dùng vừa nói:

"${user_input}"

Câu này không đề cập rõ ràng số tiền. Hãy phản hồi lại bằng một **câu hỏi gần gũi, tự nhiên và gợi mở**, ví dụ:

- "Nghe ngon quá, hong biết bạn ăn hết bao nhiêu tiền?"
- "Phở chắc ngon lắm ha, hết nhiêu tiền vậy bạn?"
- "Món này hấp dẫn ghê, không biết tốn bao nhiêu hén?"

⚠️ Trả về đúng định dạng sau:

{
  "response_type": "natural",
  "message": "Câu hỏi của bạn theo phong cách thân thiện"
}

⚠️ Không thêm lời giải thích, chỉ in JSON như trên.
    `;
  }

  return `
  Bạn là một trợ lý tài chính cá nhân, nhiệm vụ là trích xuất các giao dịch từ đoạn văn người dùng cung cấp.

  📌 CÂU ĐẦU VÀO:
  "${user_input}"

  📌 YÊU CẦU:
  - Trích xuất chính xác **các giao dịch**, có thể là một hoặc nhiều. 

  - group_name là tên nhóm giao dịch, ví dụ: "Đi chợ", "Mua sắm", "Ăn sáng", "Đi cafe". nếu không tìm thấy cụm từ nào phù hợp thì tóm tắt ngắn gọn ý nghĩa của các giao dịch.
  - Nếu không tìm thấy cụm nào đặc biệt → lấy toàn bộ câu gốc "${user_input}" làm "group_name".
  - Nếu không thấy ngày → dùng ngày mặc định "${now}".
    Nếu hóa đơn là hóa đơn điện, nước, internet hoặc những dịch vụ định kỳ (như tiền thuê nhà) xem group_name, thì chỉ trả về một "transaction" duy nhất với tổng tiền, và mô tả là loại dịch vụ tương ứng.
    Chỉ chia nhỏ nhiều "transactions[]" nếu hóa đơn là hóa đơn ăn uống/mua sắm có nhiều món.

  📌 ĐỊNH DẠNG PHẢI TRẢ VỀ (JSON CHUẨN):
  {
    "group_name": "Tên nhóm, ví dụ: Đi chợ, đi siêu thị, mua sắm, ăn sáng, đi cafe, đi ăn",
    "transaction_date": "${now}",
    "user_id": ${user_id},
    "total_amount": số tiền tổng cộng của giao dịch (nếu có nhiều giao dịch thì là tổng của tất cả),
    "transactions": [
      {
        "type": "expense" hoặc "income",
        "amount": số tiền (VD: 75000),
        "category": "chỉ chọn từ danh sách: [${categoryList}]",
        "description": "mô tả giao dịch"
      }
      {
        ... nếu có nhiều giao dịch thì thêm vào đây
      }
    ]
  }
    
  📌 Tài liệu cần học để rút kinh nghiệm ${trainDocs}

  📌 QUY TẮC BẮT BUỘC:
  - Trả về đúng định dạng JSON. **Không thêm lời giải thích.**
  - "amount" phải là số sau đây là các cách nói dân gian cần hiểu đúng số tiền ${currencyPrompt}
  

  - "category" chỉ được chọn từ danh sách: [${categoryList}]
  - "transaction_date" = "${now}" nếu không đề cập.
  - Nếu có cụm như: "hôm qua", "3 ngày trước", "tuần trước", "tháng trước", "2 tuần trước", "đầu tháng", "cuối tháng", "ngày 12/7", "12 tháng 7"...
    → thì phân tích ngày tương ứng dựa theo "${now}".

  - "description" là mô tả giao dịch ví dụ "mua sắm tại siêu thị", "ăn sáng tại quán A", "đi cafe với bạn B".
  - "type" là "expense" nếu là chi tiêu, "income" nếu là thu nhập.
  📌 LƯU Ý:
  Chỉ in JSON, không thêm giải thích hay lời nói nào.
  `;
};
