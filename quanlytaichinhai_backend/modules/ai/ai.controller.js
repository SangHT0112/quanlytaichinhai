import { toolHandlers } from "./ai.toolHandlers.js" // Sửa "tool Solutions" thành "toolHandlers"
import { saveFeedback } from './ai.model.js'
import { addTransaction } from "../transaction/transaction.model.js"
import { getCategory, getCategoryIdByKeyword } from "../category/category.model.js"
import { generateTransactionPrompt } from "./prompts/transactionPrompt.js"
import { generateComponentPrompt } from "./prompts/componentPrompt.js"
import { generateNaturalPrompt } from "./prompts/naturalPrompt.js"
import { generateFollowupPrompt } from "./prompts/generateFollowupPrompt.js"
import { getChatHistory } from "../chat_history/chat_history.model.js"
import { format } from "date-fns"
import fetch from 'node-fetch'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const handleChat = async (req, res) => {
  const user_id = req.body.user_id
  const user_input = req.body.message || ""
  const now = new Date().toISOString().split("T")[0]
  // Lấy lịch sử chat từ DB
  let history = [];
  if (user_id) {
    try {
      history = await getChatHistory(user_id, 5); // Lấy tối đa 20 tin nhắn gần nhất
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử chat từ DB:", error);
      // Tiếp tục với history rỗng nếu có lỗi
    }
  }
  console.log("🧑 user_id:", user_id)
  console.log("💬 user_input:", user_input)
  console.log("📚 history:", history)


  const historyText = history
    .map((msg) => {
      if (msg.role === "user") {
        return `Người dùng: ${msg.content}`
      } else {
        // Nếu có structured JSON → đưa vào để AI có dữ liệu
        const structuredText = msg.structured ? `\n(JSON: ${JSON.stringify(msg.structured)})` : ""
        return `AI: ${msg.content}${structuredText}`
      }
    })
    .join("\n")

  try {
    // === Phân loại intent nội bộ ===
    const classifyPromptPath = path.join(__dirname, 'documents', 'ai_prompt_classify.txt')
    const classifyBasePrompt = fs.readFileSync(classifyPromptPath, 'utf-8')
    const classifyPrompt = classifyBasePrompt.replace("${user_input}", user_input)

    const classifyRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: classifyPrompt,
        stream: false
      })
    })

    if (!classifyRes.ok) {
      throw new Error("Lỗi khi phân loại intent")
    }

    const classifyData = await classifyRes.json()
    const rawIntent = classifyData.response?.trim().toLowerCase()
     const validIntents = ["transaction", "component", "followup"]
    const intent = validIntents.includes(rawIntent) ? rawIntent : "natural"

    // === Tạo prompt chính theo intent ===
    let prompt = ""
    let formatType = "json"
    if (intent === "transaction") {
      prompt = await generateTransactionPrompt({ user_input, now, user_id })
    } else if (intent === "component") {
      prompt = generateComponentPrompt({ user_input, historyText })
    } else if(intent === "followup") {
      prompt = generateFollowupPrompt({ user_input, historyText })
      formatType = undefined
    }else{
      prompt = generateNaturalPrompt({ user_input, historyText })
      formatType = undefined
    }

    // === Gửi request chính ===
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
        format: formatType
      })
    })

    if (!ollamaRes.ok) {
      throw new Error("Ollama xử lý thất bại")
    }

    const data = await ollamaRes.json()
    let aiText = data.response?.trim() || "Không nhận được phản hồi từ AI."
    let structured = null

    if (intent === "transaction") {
      // Cắt lấy phần JSON từ response
      const jsonStart = aiText.indexOf('{')
      const jsonEnd = aiText.lastIndexOf('}') + 1
      aiText = aiText.slice(jsonStart, jsonEnd)

      try {
        const parsed = JSON.parse(aiText)

        // Nếu là format mới (gồm group)
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          structured = {
            group_name: parsed.group_name || null,
            transaction_date: parsed.transaction_date || now,
            user_id: parsed.user_id || user_id,
            transactions: parsed.transactions.map(tx => ({
              ...tx,
              amount: Number(tx.amount) || 0
            }))
          }
        }

        // Nếu vẫn là mảng đơn giản (format cũ)
        else if (Array.isArray(parsed)) {
          structured = {
            group_name: null,
            transaction_date: now,
            user_id,
            transactions: parsed.map(tx => ({
              ...tx,
              amount: Number(tx.amount) || 0
            }))
          }
        }

        // Nếu là 1 object đơn
        else if (parsed && typeof parsed === "object") {
          structured = {
            group_name: null,
            transaction_date: now,
            user_id,
            transactions: [{
              ...parsed,
              amount: Number(parsed.amount) || 0
            }]
          }
        } else {
          structured = { group_name: null, transaction_date: now, user_id, transactions: [] }
        }

      } catch (e) {
        console.warn("⚠️ Parse JSON failed:", aiText)
        structured = { group_name: null, transaction_date: now, user_id, transactions: [] }
      }
    }
else if (intent === "component") {
      try {
        structured = JSON.parse(aiText)
      } catch (e) {
        structured = { error: "Không hiểu" }
      }
    } else {
      structured = { response: aiText }
    }

    res.json({
      intent,
      raw: aiText,
      structured
    })
  } catch (error) {
    console.error("❌ handleChat error:", error.message)
    res.status(500).json({ error: `Lỗi xử lý AI: ${error.message}` })
  }
}


export const confirmTransaction = async (req, res) => {
  try {
    const { user_id, user_input, ai_suggested, user_corrected, confirmed } = req.body;

    if (!user_input || !ai_suggested || ai_suggested.length === 0) {
      return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    const transactions = Array.isArray(ai_suggested) ? ai_suggested : [ai_suggested];

    await saveFeedback({
      user_input,
      ai_suggested,
      user_corrected,
      confirmed,
    });

    if (confirmed) {
      for (const tx of transactions) {
        const category_id = await getCategoryIdByKeyword(tx.category);
        if (!category_id) {
          return res.status(400).json({
            error: `Không tìm thấy danh mục "${tx.category}"`,
          });
        }

        const dbData = {
          user_id,
          amount: tx.amount,
          category_id,
          purpose_id: null,
          type: tx.type,
          description: user_input,
          transaction_date: tx.date || new Date().toISOString().split("T")[0],
        };

        await addTransaction(dbData);
      }
    }

    res.json({
      success: true,
      message: confirmed
        ? "✅ Đã lưu các giao dịch vào hệ thống"
        : "⚠️ Giao dịch không được xác nhận",
    });
  } catch (error) {
    console.error("❌ Lỗi xác nhận:", error.message);
    res.status(500).json({ error: `Lỗi server khi xử lý giao dịch: ${error.message}` });
  }
};
