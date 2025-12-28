export const generateExplainPrompt = ({ user_input, query_result }) => {
  return `
Dưới đây là câu hỏi của người dùng:
"${user_input}"

Và đây là kết quả từ cơ sở dữ liệu (có thể là danh sách giao dịch, tổng số tiền, hoặc các thông tin khác):
${JSON.stringify(query_result, null, 2)}

Hãy viết một câu trả lời ngắn gọn, tự nhiên, dễ hiểu như đang trò chuyện chuyên nghiệp với một người bạn quản lý tài chính. Có thể kèm thêm icon phù hợp (như 💰 cho tiền bạc, 📊 cho thống kê). Ưu tiên:
- Diễn giải cụ thể các số liệu (nếu có tổng tiền, liệt kê danh sách thì hãy nêu rõ, ví dụ: "Bạn đã chi 2,300,000đ cho ăn uống, trong đó có các giao dịch như 'ăn phở' (500,000đ) và 'uống trà sữa' (200,000đ)...").
- Tránh trả lời chung chung hoặc mơ hồ.
- **Tuyệt đối không hiển thị SQL hoặc từ ngữ kỹ thuật.**
- **Kết thúc bằng một câu hỏi follow-up thân thiện để khuyến khích tương tác, luôn là dạng đề nghị cụ thể dựa sát ngữ cảnh câu hỏi** (ví dụ: nếu hỏi tổng tiền đổ xăng tháng này, hỏi "Bạn có muốn liệt kê các ngày đã đổ xăng trong tháng hay không?"; nếu hỏi về chi tiêu ăn uống, hỏi "Bạn có muốn xem cách tiết kiệm cho hạng mục ăn uống này không?"; nếu hỏi tổng quát, hỏi "Bạn có muốn xem chi tiết theo tuần trong tháng này không?"). Làm cho nó tự nhiên, không gượng ép, và luôn khuyến khích hành động tiếp theo liên quan trực tiếp đến dữ liệu vừa đề cập.
- **Để hỗ trợ interactive UI, thêm structured JSON ở cuối phản hồi (KHÔNG hiển thị trong text)**: 
  {
    "followup": {
      "question": "Câu hỏi follow-up đề nghị của bạn (ví dụ: 'Bạn có muốn liệt kê các ngày đã đổ xăng trong tháng hay không?')",
      "suggestedQuery": "Câu truy vấn gợi ý để gửi tiếp nếu user nhấn 'Có' (ví dụ: 'Liệt kê các ngày đổ xăng tháng 12/2025')"
    }
  }
  Nếu không có follow-up phù hợp, để "followup": null (nhưng ưu tiên luôn có, trừ khi dữ liệu không cho phép).

Ví dụ phản hồi text: "Tháng này bạn đã đổ xăng tổng cộng 1,500,000đ 💸. Bạn có muốn liệt kê các ngày đã đổ xăng trong tháng hay không?"
Ví dụ structured: { "followup": { "question": "Bạn có muốn liệt kê các ngày đã đổ xăng trong tháng hay không?", "suggestedQuery": "Liệt kê các ngày đổ xăng tháng 12/2025" } }
  `.trim();
};