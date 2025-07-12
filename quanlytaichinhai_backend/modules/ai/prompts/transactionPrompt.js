import { getCategory } from "../../category/category.model.js"

export const generateTransactionPrompt = async ({ user_input, historyText, now, user_id }) => {
  const categories = await getCategory()
  const categoryList = categories.join(", ")
  return `
    Bạn là trợ lý tài chính. Dựa trên lịch sử hội thoại sau:
    ${historyText}

    Chỉ trả về JSON với định dạng sau:
    {
      "type": "expense" hoặc "income",
      "amount": số_tiền,
      "category": "danh_mục",
      "date": "YYYY-MM-DD",
      "user_id": ${user_id}
    }
    type là expense nếu liên quan đến mua, xài.. income nếu là lương, thưởng
    category chọn phù hợp [${categoryList}]
    Nếu không hiểu, trả về {"error": "Không hiểu"}
    Nếu người dùng nói "hôm nay", "nay", "today" thì dùng ngày ${now}

    Câu hỏi hiện tại: "${user_input}"
    Chỉ trả về JSON, không thêm bất kỳ text nào khác!
  `
}
