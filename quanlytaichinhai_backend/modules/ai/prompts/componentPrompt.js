import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateComponentPrompt = ({ user_input }) => {
  const hintPath = path.join(__dirname, "../documents/component_hint.txt");
  const componentGuide = fs.readFileSync(hintPath, "utf-8");

  return `
    Đây là tài liệu bạn có thể học: ${componentGuide}

    Nhiệm vụ: Phân tích câu hỏi người dùng và trả về **component phù hợp nhất** dưới dạng JSON dựa trên từ khóa và ý định.

    Câu hỏi hiện tại: "${user_input}"

    Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.
  `;
};