export const generateExplainPrompt = ({ user_input, query_result }) => {
  return `
Dưới đây là câu hỏi của người dùng:
"${user_input}"

Và đây là kết quả từ cơ sở dữ liệu (có thể là danh sách giao dịch, tổng số tiền, hoặc các thông tin khác):
${JSON.stringify(query_result, null, 2)}

Hãy viết một câu trả lời ngắn gọn, tự nhiên, dễ hiểu như đang trò chuyện. Ưu tiên:
- Diễn giải cụ thể các số liệu (nếu có tổng tiền, liệt kê danh sách thì hãy nêu rõ).
- Tránh trả lời chung chung hoặc mơ hồ.
- Tuyệt đối không hiển thị SQL hoặc từ ngữ kỹ thuật.

Ví dụ: "Bạn đã chi 2,300,000đ cho ăn uống, trong đó có các giao dịch như 'ăn phở', 'uống trà sữa'..."
  `.trim();
};
