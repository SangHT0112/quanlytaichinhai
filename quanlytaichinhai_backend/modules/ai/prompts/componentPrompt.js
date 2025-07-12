import fs from "fs"
import path from "path"

export const generateComponentPrompt = ({ user_input, historyText }) => {
  const hintPath = path.join(__dirname, "../documents/component_hint.txt")
  const componentGuide = fs.readFileSync(hintPath, 'utf-8')

  return `
    Đây là tài liệu bạn có thể học ${componentGuide}
    Bạn là trợ lý tài chính. Dựa trên lịch sử hội thoại sau:
    ${historyText}

    Nhiệm vụ: Nếu người dùng yêu cầu xem biểu đồ thu chi gần đây hoặc một số tháng cụ thể,
    hãy trả về JSON dạng sau:

    [
      {
        "type": "text",
        "text": "📈 Dưới đây là biểu đồ thu chi của bạn:",
        "style": "default"
      },
      {
        "type": "component",
        "name": "MonthlyBarChart",
        "layout": "block",
        "props": {
          "initialMonths": số_tháng
        }
      }
    ]

    Nếu không hiểu, trả về: { "error": "Không hiểu" }

    Câu hỏi hiện tại: "${user_input}"
    Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.
  `
}
