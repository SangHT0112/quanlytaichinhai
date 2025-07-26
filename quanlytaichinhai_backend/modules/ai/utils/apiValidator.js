// src/utils/apiValidator.js
export const validateApiKeys = (apiKeys) => {
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error("Không có khóa API Gemini hợp lệ nào được cấu hình");
  }
};