export const generateImagePrompt = async ({ user_input, now, user_id, historyText }) => {
  // Bạn có thể tùy chỉnh prompt nếu cần
  return `Tạo hình ảnh dựa trên mô tả: ${user_input}`;
};