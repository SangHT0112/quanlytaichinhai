export const generateBillPrompt = async ({ ocrText, now, user_id }) => {
  return `
Bạn là một trợ lý tài chính cá nhân, nhiệm vụ là trích xuất thông tin từ dữ liệu OCR của một hóa đơn.

📌 DỮ LIỆU OCR:
${ocrText}

📌 YÊU CẦU:
- **group_name**: Lấy từ dòng đầu tiên của dữ liệu OCR (thường là tên hóa đơn hoặc tên quán ăn). Nếu không có dòng rõ ràng, dùng "Hóa đơn".
- **total_amount**: Lấy từ dòng chứa "Tổng cộng", "Tổng tiền", "Thành tiền", "Tổng cộng", hoặc tương tự. Chuyển giá trị thành số nguyên (ví dụ: "537.000" thành 537000, "75k" thành 75000).
- **transaction_date**: Nếu có ngày rõ ràng trong dữ liệu OCR, dùng ngày đó. Nếu không, dùng ngày hiện tại "${now}".
- description: Nếu chỉ có một giao dịch duy nhất, dùng "group_name" làm mô tả. Nếu có nhiều giao dịch, mô tả sẽ được lấy từ các dòng khác nhau trong dữ liệu OCR.
- amount sẽ lấy từ giá trị "total_amount" nếu chỉ có một giao dịch duy nhất. Nếu có nhiều giao dịch, sẽ lấy giá trị tương ứng từ các dòng khác nhau trong dữ liệu OCR.
 ví dụ Dữ liệu OCR có chuỗi:  "Mi Xào Hài Sán","130,000", vậy description sẽ là "Mi Xào Hài Sán" và amount sẽ là 130000.
📌 KẾT QUẢ PHẢI TRẢ VỀ (CHỈ JSON):
{
  "group_name": "Tên hóa đơn hoặc 'Hóa đơn' nếu không rõ",
  "transaction_date": <ngày giao dịch>,
  "total_amount": <số tiền tổng, ví dụ: 537000>
  "transactions": [
    {
      "type": "expense"
      "amount": total_amount,      nếu chỉ có một giao dịch duy nhất
      "category": "Hóa đơn",
      "description": "group_name"  nếu chỉ có một giao dịch duy nhất
    }
    {
     // Nếu có nhiều giao dịch, thêm vào đây
    }
  ]
}

📌 QUY TẮC:
- Trả về đúng định dạng JSON.
- Không thêm lời giải thích hoặc bất kỳ văn bản nào khác.
- "total_amount" phải là số nguyên.
- transactions là mảng chứa 1 item duy nhất
  `;
};
