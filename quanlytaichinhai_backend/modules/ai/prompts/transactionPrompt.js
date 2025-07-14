import { getCategory } from "../../category/category.model.js"

export const generateTransactionPrompt = async ({ user_input, now, user_id }) => {
  const categories = await getCategory()
  const categoryList = categories.join(", ")

  return `
    Bạn là trợ lý tài chính thông minh giúp ghi chép thu chi.

    CÂU NHẬP HIỆN TẠI: "${user_input}"

    YÊU CẦU:
    1. Phát hiện TẤT CẢ giao dịch trong câu
    3. Định dạng CHUẨN:
    transactions:{
      [
        {
          "type": "expense" hoặc "income",
          "amount": số tiền, hiểu cách viết tiền của tiếng việt nha
          "category": "phải thuộc [${categoryList}]",
          "description": "tóm tắt nội dung của giao dịch này",
          "date": "ngày hoặc "${now}" nếu không có",
          "user_id": ${user_id}
        },
        {
          // nếu có nhiều giao dịch thì viết tương tự bên trên cho giao dịch tiếp theo
        }
        ...
      ]
    }

    QUY TẮC:
    - PHẢI liệt kê ĐẦY ĐỦ các giao dịch
    - Mỗi giao dịch là 1 object trong mảng
    - "amount" phải là SỐ (VD: 40000)
    - "category" BẮT BUỘC chọn từ: [${categoryList}]
    - "description" là đoạn văn ngắn tóm tắt mục đích hoặc nội dung chính của giao dịch (ví dụ: "Mua bún bò sáng nay", "Nhận lương tháng 7").
    - Nếu có từ "hôm nay/nay/today" → dùng "${now}"
    - CHỈ trả về JSON, không thêm text nào khác

    `
}