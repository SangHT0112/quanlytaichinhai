import { getCategory } from "../../category/category.model.js"

export const generateTransactionPrompt = async ({ user_input, now, user_id }) => {
  const categories = await getCategory()
  const categoryList = categories.join(", ")

  return `
Bạn là một trợ lý tài chính cá nhân, nhiệm vụ là trích xuất các giao dịch từ đoạn văn người dùng cung cấp.

📌 CÂU ĐẦU VÀO:
"${user_input}"

📌 YÊU CẦU:
- Trích xuất chính xác **các giao dịch**, có thể là một hoặc nhiều.
- Nếu câu văn chứa cụm như: "đi chợ", "mua sắm", "ăn sáng", "đi siêu thị", "đi cafe", "đi ăn", thì dùng cụm đó làm "group_name".
- Nếu không tìm thấy cụm nào đặc biệt → lấy toàn bộ câu gốc "${user_input}" làm "group_name".
- Nếu không thấy ngày → dùng ngày mặc định "${now}".

📌 ĐỊNH DẠNG PHẢI TRẢ VỀ (JSON CHUẨN):
{
  "group_name": "Tên nhóm, ví dụ: Đi chợ, đi siêu thị, mua sắm, ăn sáng, đi cafe, đi ăn",
  "transaction_date": "${now}",
  "user_id": ${user_id},
  "transactions": [
    {
      "type": "expense" hoặc "income",
      "amount": số tiền (VD: 75000),
      "category": "chỉ chọn từ danh sách: [${categoryList}]",
      "description": "mô tả ngắn gọn"
    }
    {
      ... nếu có nhiều giao dịch thì thêm vào đây
    }
  ]
}

📌 QUY TẮC BẮT BUỘC:
- Trả về đúng định dạng JSON. **Không thêm lời giải thích.**
- "amount" phải là số (có thể viết kiểu 75k, 100.000, 1tr v.v).
- "category" chỉ được chọn từ danh sách: [${categoryList}]
- "transaction_date" = "${now}" nếu không đề cập. nếu có đề cập tới ví dụ hôm qua, 3 ngày trước thì lấy ${now} trừ đi tương ứng
- "description" là mô tả ngắn ý nghĩa giao dịch.

Chỉ in JSON, không thêm giải thích hay lời nói nào.
`
}
