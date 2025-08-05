import { getCategory } from "../../category/category.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const generateAmountPrompt = async ({ user_input, historyText, now, user_id }) => {
  const categories = await getCategory();
  const categoryList = categories.join(", ");

  const hintPath = path.join(__dirname, "../train_documents/amountTrainDocs.txt");
  const trainDocs = fs.readFileSync(hintPath, "utf-8");
  return `
    Bạn là trợ lý tài chính thông minh. Nhiệm vụ là xử lý input số tiền (như "35k", "35k nhá") sau khi người dùng cung cấp ngữ cảnh giao dịch trong lịch sử hội thoại.

    Lịch sử hội thoại:
    ${historyText}

    Input hiện tại: "${user_input}"

    Yêu cầu:
    - Nếu input là số tiền (ví dụ: "1 củ 2", "35k", "2tr", "35k nhá") và lịch sử có câu input người dùng trước đó liên quan đến giao dịch ăn uống (ví dụ: "Nay ăn phở quán bà 6"), tạo một giao dịch mới.  
        --> ${trainDocs} đây là những trường hợp khác 
    - Sử dụng hoạt động chính từ câu input người dùng gần nhất làm group_name và description.
    - Trả về JSON hợp lệ:
      {
        "group_name": "Tóm tắt hoạt động (ví dụ: Ăn phở)",
        "transaction_date": "${now}",
        "user_id": ${user_id},
        "total_amount": Số tiền
        "transactions": [
          {
            "type": "expense",
            "amount": Số tiền,
            "category": "Ăn uống",
            "description": "Tóm tắt hoạt động (ví dụ: Ăn phở)"
          }
        ]
      }

    Ví dụ:
    - Lịch sử:
      Người dùng: Nay ăn phở quán bà 6
      AI: {"response_type": "natural", "message": "Wow, bữa phở nghe là thích rồi! Nhưng bạn chưa nói chi bao nhiêu tiền nha, cho mình biết với!"}
      Người dùng: 35k nhá
    - Output:
      {
        "group_name": "Ăn phở",
        "transaction_date": "${now}",
        "user_id": ${user_id},
        "total_amount": 35000,
        "transactions": [
          {
            "type": "expense",
            "amount": 35000,
            "category": "Ăn uống",
            "description": "Ăn phở"
          }
        ]
      }

    Quy tắc bắt buộc:
    - Trả về chỉ JSON hợp lệ, không thêm giải thích hay markdown.
    - "amount" phải là số (chuyển đổi "35k" hoặc "35k nhá" thành 35000, "2tr" thành 2000000).
    - "category" chỉ chọn từ danh sách: [${categoryList}]
    - "group_name" và "description" lấy từ hoạt động chính trong câu input người dùng gần nhất (ví dụ: "Ăn phở" từ "Nay ăn phở quán bà 6").
    - Nếu user_input chứa cả lý do và số tiền, trích "lý do" làm group_name và description (ví dụ: "tiền ăn xin + 500k" → group_name: "Tiền ăn xin", amount: 500000).
    - Bỏ chi tiết không cần thiết như "quán bà 6", "rất ngon".
    - Nếu không đủ thông tin, trả về: {"error": "Không đủ thông tin để tạo giao dịch."}
  `;
};