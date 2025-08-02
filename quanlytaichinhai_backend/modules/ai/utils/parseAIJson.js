// utils/parseAIJson.js
export const parseJsonFromText = (text, { fallback = null, throwOnError = false } = {}) => {
  try {
    // Loại bỏ markdown và khoảng trắng thừa
    let cleanedText = text
      .replace(/^```json\s*\n?/, '') // Loại bỏ ```json
      .replace(/\n?```$/, '') // Loại bỏ ```
      .replace(/^\s+|\s+$/g, ''); // Loại bỏ khoảng trắng
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      if (throwOnError) {
        throw new Error('Không tìm thấy JSON hợp lệ trong phản hồi AI.');
      }
      return fallback;
    }
    return JSON.parse(cleanedText.slice(jsonStart, jsonEnd));
  } catch (e) {
    console.warn(`⚠️ Parse JSON failed: ${e.message}`);
    if (throwOnError) {
      throw e;
    }
    return fallback;
  }
};