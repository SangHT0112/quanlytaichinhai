export const generateBillPrompt = async ({ ocrText, now, user_id }) => {
  return `
Bạn là một trợ lý tài chính cá nhân thông minh. Nhiệm vụ của bạn là:
1. **Sửa chính tả các dòng tiếng Việt bị lỗi do OCR (như thiếu dấu, sai dấu, lỗi ký tự)**
2. **Trích xuất thông tin giao dịch từ dữ liệu hóa đơn sau khi đã sửa chính tả**

=== DỮ LIỆU OCR GỐC ===
${ocrText}

=== HƯỚNG DẪN SỬA CHÍNH TẢ ===
- Sửa lỗi chính tả, lỗi dấu tiếng Việt do hệ thống OCR gây ra.
- Ví dụ: "Glá bán" → "Giá bán", "T6ng tièn" → "Tổng tiền", "NUÓC MÁM" → "NƯỚC MẮM"
- Không thêm hoặc bớt nội dung, chỉ sửa lỗi.

=== HƯỚNG DẪN TRÍCH XUẤT ===
Trả về một chuỗi JSON với định dạng như sau:

{
  "group_name": "Tên quán ăn / cửa hàng (thường là dòng đầu tiên, nếu không có thì ghi 'Hóa đơn')",
  "transaction_date": "Ngày giao dịch (định dạng YYYY-MM-DD, nếu không có thì dùng ngày hiện tại: ${now})",
  "total_amount": "Tổng số tiền (dạng số nguyên, ví dụ: 213500)",
  "transactions": [
    {
      "type": "expense",
      "amount": <giá trị>,
      "category": "Ăn uống",
      "description": <tên món hàng hoặc chi tiết>
    },
    ...
  ]
}

=== NGUYÊN TẮC BẮT BUỘC ===

1. Nếu hóa đơn chỉ có 1 giao dịch (không liệt kê từng món riêng lẻ):
- Mảng transactions chỉ có 1 phần tử duy nhất.
- amount = total_amount
- description = group_name
- category = "Hóa đơn"

2. Nếu hóa đơn có nhiều món:
- Mỗi dòng có số tiền (như '55.000', '90,000', '100.000', '42, 000') phải tạo thành một item trong transactions.
- Tìm dòng phía trước số tiền phù hợp là tên món ăn → dùng làm description.
- Luôn dùng "Ăn uống" cho category, "expense" cho type.
- Bỏ qua các dòng không liên quan như 'Cảm ơn quý khách', 'Giảm giá', v.v.

3. Luôn đảm bảo:
- Lấy tất cả các món có số tiền tương ứng
- Không bỏ sót món nào
- Không viết thêm lời giải thích hoặc văn bản khác ngoài JSON

=== MẪU OUTPUT ===
{
  "group_name": "LIKE CAFE",
  "transaction_date": "2014-01-19",
  "total_amount": 540000,
  "transactions": [
    {
      "type": "expense",
      "amount": 42000,
      "category": "Ăn uống",
      "description": "1 BÚN SING"
    },
    {
      "type": "expense",
      "amount": 37000,
      "category": "Ăn uống",
      "description": "1 MÌ GIÒN XÀO CHAY"
    }
  ]
}
`;
};
