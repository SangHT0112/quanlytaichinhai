import fetch from 'node-fetch';
import FormData from 'form-data';

// Lấy danh sách key từ biến môi trường (ưu tiên dạng mảng)
const getApiKeys = () => {
  try {
    const keysFromJson = JSON.parse(process.env.STABILITY_API_KEYS || '[]');
    if (Array.isArray(keysFromJson) && keysFromJson.length > 0) return keysFromJson;
  } catch (e) {}

  // Nếu không có STABILITY_API_KEYS thì lấy từng key riêng lẻ
  const keys = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`STABILITY_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
};

export const fetchStabilityAI = async (prompt, options = {}) => {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error("Không tìm thấy bất kỳ API Key nào cho Stability AI.");
  }

  const url = "https://api.stability.ai/v2beta/stable-image/generate/ultra";
  const defaultOptions = {
    output_format: "png",
    ...options,
  };

  const errors = [];

  for (let key of apiKeys) {
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", defaultOptions.output_format);
    formData.append("aspect_ratio", defaultOptions.aspect_ratio || "16:9"); // Mặc định 16:9
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: "image/*",
        },
        body: formData,
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ API key bị lỗi (${key.slice(0, 6)}...):`, errorText);
        errors.push({ key, error: errorText });
      }
    } catch (error) {
      console.warn(`⚠️ Không thể dùng API key (${key.slice(0, 6)}...):`, error.message);
      errors.push({ key, error: error.message });
    }
  }

  // Nếu không key nào thành công
  throw new Error("Tất cả các API key đều thất bại:\n" + JSON.stringify(errors, null, 2));
};
