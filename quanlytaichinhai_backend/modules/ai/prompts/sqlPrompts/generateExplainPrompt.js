export const generateExplainPrompt = ({ user_input, query_result }) => {
  return `
Dưới đây là câu hỏi người dùng:
"${user_input}"

Và đây là dữ liệu kết quả từ truy vấn:
${JSON.stringify(query_result, null, 2)}

Hãy trả lời người dùng một cách tự nhiên, ngắn gọn và dễ hiểu. Không đưa ra SQL hay cấu trúc kỹ thuật.
  `.trim();
};
