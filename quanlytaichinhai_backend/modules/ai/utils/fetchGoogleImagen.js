import fetch from 'node-fetch';

const getApiKey = () => {
  // Lấy danh sách key từ GOOGLE_API_KEY_1 đến GOOGLE_API_KEY_5
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GOOGLE_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys.length > 0 ? keys : ['']; // Trả về mảng key hoặc mảng rỗng nếu không có
};

export const fetchGoogleImagen = async (prompt) => {
  const apiKeys = getApiKey();
  if (apiKeys.length === 0 || !apiKeys[0]) {
    throw new Error("Không tìm thấy API Key nào cho Google Imagen.");
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict";
  const errors = [];

  for (let key of apiKeys) {
    const headers = {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: {
        sampleCount: 1, // Số lượng ảnh (tối đa 4 với Standard)
      },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      const result = await response.json();

      if (response.ok && result.predictions && result.predictions.length > 0) {
        const imageBytes = Buffer.from(result.predictions[0].imageBytes, 'base64'); // Lấy ảnh dưới dạng buffer
        return imageBytes;
      } else {
        console.warn(`⚠️ API key lỗi (${key.slice(0, 6)}...):`, result);
        errors.push({ key, error: result });
      }
    } catch (error) {
      console.warn(`⚠️ Không thể gọi Google Imagen với key (${key.slice(0, 6)}...):`, error.message);
      errors.push({ key, error: error.message });
    }
  }

  throw new Error("Tất cả các API key đều thất bại:\n" + JSON.stringify(errors, null, 2));
};