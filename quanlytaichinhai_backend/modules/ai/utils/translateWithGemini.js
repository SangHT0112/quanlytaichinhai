import { fetchWithFailover } from './fetchWithFailover.js';

export const translateWithGemini = async (promptVN) => {
  const translationPrompt = `
    Bạn là trợ lý dịch thuật và mở rộng prompt tạo ảnh. Hãy:
    1. Dịch prompt tiếng Việt sau sang tiếng Anh
    2. Mở rộng thành mô tả chi tiết cho AI image generation
    3. Giữ nguyên ý tưởng chính của người dùng
    4. Thêm các yếu tố về phong cách, chất lượng, bố cục phù hợp

    Prompt tiếng Việt: "${promptVN}"
    Lưu ý: Ảnh sẽ được hiển thị trên màn hình 1920x1080, tỷ lệ 16:9. Hãy mô tả phù hợp với bố cục ngang (landscape).
    Hãy cung cấp prompt tiếng Anh đã được mở rộng và làm chi tiết:
`;

  try {
    const response = await fetchWithFailover({
      contents: [{ parts: [{ text: translationPrompt }] }],
    });

    const translated = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return translated || promptVN; // Fallback về prompt gốc nếu không dịch được
  } catch (error) {
    console.error('Translation error:', error);
    return promptVN;
  }
};