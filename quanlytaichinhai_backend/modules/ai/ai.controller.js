// import { openai } from "./openai.js"
import { toolHandlers } from "./ai.toolHandlers.js"
import { saveFeedback } from './ai.model.js'
import { addTransaction } from "../transaction/transaction.model.js"
import { getCategoryIdByKeyword } from "../category/category.model.js"
import { format } from "date-fns"
import fetch from 'node-fetch'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export const classifyMessage = async (req, res) => {
  const user_input = req.body.message || ""

  const promptPath = path.join(__dirname, 'documents', 'ai_prompt_classify.txt')
  const basePrompt = fs.readFileSync(promptPath, 'utf-8')
  const fullPrompt = basePrompt.replace("${user_input}", user_input)

  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: fullPrompt,
        stream: false
      })
    })

    const data = await ollamaRes.json()
    const rawResponse = data.response?.trim().toLowerCase()

    const intent = ["transaction", "component"].includes(rawResponse)
      ? rawResponse
      : "unknown"

    res.json({ intent })
  } catch (err) {
    console.error("❌ Lỗi phân loại:", err)
    res.status(500).json({ intent: "unknown", error: "AI classify failed" })
  }
}
export const handleChat = async (req, res) => {
  const user_input = req.body.message || "Tôi tiêu 100k ăn sáng hôm nay"

  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `
          Bạn là trợ lý tài chính. Chỉ trả về JSON với định dạng sau:
          {
            "type": expense hoặc income
            "amount": số_tiền,
            "category": "danh_mục",
            "date": "YYYY-MM-DD",
            "user_id": 1
          }
          type là expense nếu liên quan đến mua, xài.. income nếu là lương, thưởng
          category chọn phù hợp [Lương, Ăn uống, Di chuyển, Giải trí, Hóa đơn, Y tế, Giáo dục, Du lịch, ]
          Nếu không hiểu, trả về {"error": "Không hiểu"}
          date các từ như hôm nay, nay... thì lấy giờ now hiện tại

          Câu hỏi: "${user_input}"
          Chỉ trả về JSON, không thêm bất kỳ text nào khác!
        `,
        stream: false,
        format: "json" // Thêm dòng này để yêu cầu trả về JSON
      })
    })

    const data = await ollamaRes.json()
    let aiText = data.response?.trim() || ""

    // Xử lý trường hợp AI thêm text thừa
    const jsonStart = aiText.indexOf('{')
    const jsonEnd = aiText.lastIndexOf('}') + 1
    if (jsonStart !== -1 && jsonEnd !== -1) {
      aiText = aiText.slice(jsonStart, jsonEnd)
    }

    let structured = null
    try {
      structured = JSON.parse(aiText)
      
      // Xử lý ngày "today"
      if (structured.date === "today") {
        structured.date = format(new Date(), 'yyyy-MM-dd')
      }
    } catch (e) {
      console.warn("⚠️ Parse JSON failed:", aiText)
      structured = { error: "Không hiểu" }
    }

    await saveFeedback({
      user_input,
      ai_suggested: structured,
      user_corrected: null,
      confirmed: null,
    })

    res.json({
      raw: aiText,
      structured,
    })
  } catch (error) {
    console.error("❌ Ollama error:", error)
    res.status(500).json({ error: "Lỗi AI" })
  }
}

export const handleChartRequest = async (req, res) => {
  const user_input = req.body.message || "Xem biểu đồ thu chi 3 tháng qua"
  const hintPath = path.join(__dirname, 'documents', 'component_hint.txt')
  const componentGuide = fs.readFileSync(hintPath, 'utf-8')
  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `
              Đây là tài liệu bạn có thể học ${componentGuide}
          Bạn là trợ lý tài chính. Nhiệm vụ: Nếu người dùng yêu cầu xem biểu đồ thu chi gần đây hoặc một số tháng cụ thể,
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

          Nếu người dùng nói "tháng này" hoặc "gần đây" => số_tháng là 1 hoặc 3.
          Nếu nói "3 tháng", "5 tháng" => lấy đúng số đó.

          Nếu không hiểu, trả về: { "error": "Không hiểu" }

          Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.

          Câu hỏi: "${user_input}"
        `,
        stream: false,
        format: "json"
      })
    })

    const data = await ollamaRes.json()
    let aiText = data.response?.trim() || ""

    const jsonStart = aiText.indexOf('{') !== -1 ? aiText.indexOf('{') : aiText.indexOf('[')
    const jsonEnd = aiText.lastIndexOf('}') + 1
    if (jsonStart !== -1 && jsonEnd !== -1) {
      aiText = aiText.slice(jsonStart, jsonEnd)
    }

    let structured = null
    try {
      structured = JSON.parse(aiText)
    } catch (e) {
      console.warn("⚠️ Parse JSON failed:", aiText)
      structured = { error: "Không hiểu" }
    }

    res.json({
      raw: aiText,
      structured
    })
  } catch (error) {
    console.error("❌ Ollama error:", error)
    res.status(500).json({ error: "Lỗi AI" })
  }
}


// ✅ API xác nhận hoặc chỉnh sửa giao dịch
export const confirmTransaction = async (req, res) => {
  try {
    const { user_input, ai_suggested, user_corrected, confirmed } = req.body;

    if (!user_input || !ai_suggested) {
      return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    // Lấy dữ liệu đã được xác nhận hoặc chỉnh sửa
    const transactionData = user_corrected || ai_suggested;

    // Lấy category_id từ tên danh mục
    console.log(`Tìm category_id cho: "${transactionData.category}"`);
    const category_id = await getCategoryIdByKeyword(transactionData.category);
    console.log(`kq category_id: "${transactionData.category}"`);
    if (!category_id && confirmed) {
      return res.status(400).json({ 
        error: `Không tìm thấy danh mục "${transactionData.category}"` 
      });
    }

    // Lưu feedback
    await saveFeedback({
      user_input,
      ai_suggested,
      user_corrected,
      confirmed,
    });

    // Nếu xác nhận thì lưu giao dịch
    if (confirmed) {
      const dbData = {
        user_id: transactionData.user_id || 1,
        amount: transactionData.amount,
        category_id,
        purpose_id: null, // Có thể thêm logic xử lý mục đích
        type: "expense", // Hoặc "income" tùy logic
        description: user_input,
        transaction_date: transactionData.date || new Date().toISOString().split('T')[0],
      };

      await addTransaction(dbData);
    }

    res.json({ 
      success: true,
      message: confirmed 
        ? "✅ Đã lưu giao dịch vào hệ thống" 
        : "⚠️ Giao dịch không được xác nhận",
      category_id // Trả về để debug nếu cần
    });
  } catch (error) {
    console.error("❌ Lỗi xác nhận:", error);
    res.status(500).json({ error: "Lỗi server khi xử lý giao dịch" });
  }
};
