
import { generateTransactionPrompt } from "./prompts/transactionPrompt.js"
import { generateComponentPrompt } from "./prompts/componentPrompt.js"
import { generateNaturalPrompt } from "./prompts/naturalPrompt.js"
import { generateFollowupPrompt } from "./prompts/generateFollowupPrompt.js"
import { getChatHistory } from "../chat_history/chat_history.model.js"
import { getCategoryIdByKeyword } from "../category/category.model.js"
import { addTransaction, createTransactionGroup } from "../transaction/transaction.model.js"
import { generateAmountPrompt } from "./prompts/generateAmountPrompt.js"
import { generateExplainPrompt } from "./prompts/sqlPrompts/generateExplainPrompt.js"
import { generateSQLPrompt } from "./prompts/sqlPrompts/generateSQLPrompt.js"
import { generateForecastSQLPrompt } from "./prompts/sqlPrompts/generateForecastSQLPrompt.js"
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import { sendToBamlGemini } from "./sendToBamlGemini.js"

import db from "../../config/db.js"
// Định nghĩa __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load Gemini API keys từ environment variables
const GEMINI_API_KEYS = [
  process.env.GOOGLE_API_KEY_1,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(key => key && key !== 'xxx'); // Lọc bỏ key không hợp lệ
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// Helper function để gửi yêu cầu API với cơ chế failover
const fetchWithFailover = async (body) => {
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    const apiKey = GEMINI_API_KEYS[i];
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log(`✅ API call succeeded with key ${i + 1}`);
        return await response.json();
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ API key ${i + 1} failed with status ${response.status}: ${errorText}`);
        continue;
      }
    } catch (error) {
      console.warn(`⚠️ Error with API key ${i + 1}: ${error.message}`);
      continue;
    }
  }
  throw new Error("Tất cả các khóa API Gemini đều thất bại hoặc đã hết hạn");
};

export const handleChat = async (req, res) => {
  const user_id = req.body.user_id;
  const user_input = req.body.message || "";
  const now = new Date().toISOString().split("T")[0];

  // Kiểm tra khóa API
  if (GEMINI_API_KEYS.length === 0) {
    console.error("❌ Không có khóa API Gemini hợp lệ nào được định nghĩa trong .env");
    return res.status(500).json({ error: "Không có khóa API Gemini hợp lệ nào được cấu hình" });
  }

  // Sử dụng lịch sử từ frontend
  const history = req.body.history || [];
  console.log('Lịch sử từ frontend:', history); // Debug lịch sử

  const historyText = history
    .map((msg) => {
      if (msg.role === 'user') {
        return `Người dùng: ${msg.content}`;
      } else {
        const structuredText = msg.structured ? `\n(JSON: ${JSON.stringify(msg.structured)})` : '';
        return `AI: ${msg.content}${structuredText}`;
      }
    })
    .join('\n');

  try {
    // Phân loại intent
    const classifyPromptPath = path.resolve(__dirname, './documents/ai_prompt_classify.txt');
    const classifyBasePrompt = fs.readFileSync(classifyPromptPath, 'utf-8');
    const classifyPrompt = classifyBasePrompt.replace("${user_input}", user_input);

    const classifyData = await fetchWithFailover({
      contents: [
        {
          parts: [
            { text: classifyPrompt }
          ]
        }
      ]
    });

    const rawIntent = classifyData.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    console.log("Raw intent từ Gemini:", rawIntent);
    const validIntents = ["transaction", "amount", "component", "followup", "sql_query", "forecast"];
    const intent = validIntents.includes(rawIntent) ? rawIntent : "natural";
    console.log("Intent cuối cùng:", intent);

    // Tạo prompt chính
    let prompt = "";
    let isJsonResponse = false;
    if (intent === "transaction") {
      prompt = await generateTransactionPrompt({ user_input, now, user_id });
      isJsonResponse = true;
    } else if(intent === "amount") {
      prompt = await generateAmountPrompt({ user_input, historyText, now, user_id });
      isJsonResponse = true;
    }else if (intent === "component") {
      prompt = generateComponentPrompt({ user_input });
      isJsonResponse = true;
    }else if(intent === "sql_query"){
      prompt = generateSQLPrompt({ user_id, user_input, historyText });
    }else if (intent === "forecast") {
      prompt = generateForecastSQLPrompt({ user_input, user_id, now });
      isJsonResponse = true;
    }else if (intent === "followup") {
      prompt = generateFollowupPrompt({ user_input, historyText });
    }else {
      prompt = generateNaturalPrompt({ user_input, historyText });
    }

    // Gửi request chính
    const geminiData = await fetchWithFailover({
      contents: [
        {
          parts: [
            {
              text: isJsonResponse
                ? `${prompt}\nTrả về chỉ JSON hợp lệ, không thêm văn bản giải thích hay ký tự thừa như markdown.`
                : prompt
            }
          ]
        }
      ]
    });

    let aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Không nhận được phản hồi từ AI.";
    console.log("Phản hồi từ Gemini:", aiText);

    let structured = null;

    if (intent === "transaction" || intent === "amount" || intent === "component") {
      try {
        // Loại bỏ markdown nếu có
        const jsonStart = aiText.indexOf('{');
        const jsonEnd = aiText.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          aiText = aiText.slice(jsonStart, jsonEnd);
        }
        const parsed = JSON.parse(aiText);
        // Kiểm tra nếu phản hồi là câu hỏi tự nhiên (thiếu số tiền)
        if (parsed.response_type === "natural") {
          structured = { message: parsed.message };
          return res.json({
            intent,
            raw: parsed.message,
            structured
          });
        }
        if (intent === "transaction" || intent === 'amount') {
          if (parsed.transactions && Array.isArray(parsed.transactions)) {
            structured = {
              group_name: parsed.group_name || null,
              transaction_date: parsed.transaction_date || now,
              user_id: parsed.user_id || user_id,
              transactions: parsed.transactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount) || 0
              }))
            };
          } else if (Array.isArray(parsed)) {
            structured = {
              group_name: null,
              transaction_date: now,
              user_id,
              transactions: parsed.map(tx => ({
                ...tx,
                amount: Number(tx.amount) || 0
              }))
            };
          } else if (parsed && typeof parsed === "object") {
            structured = {
              group_name: null,
              transaction_date: now,
              user_id,
              transactions: [{
                ...parsed,
                amount: Number(parsed.amount) || 0
              }]
            };
          } else {
            structured = { group_name: null, transaction_date: now, user_id, transactions: [] };
          }
        } else if (intent === "component") {
          structured = parsed;
        }
      } catch (e) {
        console.warn(`⚠️ Parse JSON failed for ${intent}:`, aiText, e.message);
        structured = intent === "transaction"
          ? { group_name: null, transaction_date: now, user_id, transactions: [] }
          : { error: "Không hiểu" };
      }
    } 
    if (intent === "sql_query") {
      try {
        let sql = aiText.trim();
        sql = sql.replace(/^```sql\s*/i, "").replace(/```$/i, "").trim();
        
        // Validate SQL
        if (sql === "INVALID_SQL" || !sql.toLowerCase().startsWith("select")) {
          structured = { error: "Không thể tạo truy vấn hợp lệ hoặc chỉ truy vấn SELECT được hỗ trợ." };
        } else {
          const rows = await db.query(sql);  // Make sure db is properly imported

          // Generate explanation
          const explainPrompt = generateExplainPrompt({
            user_input,
            query_result: rows
          });

          const explainData = await fetchWithFailover({
            contents: [{ parts: [{ text: explainPrompt }] }]
          });

          aiText = explainData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                  "Đây là kết quả truy vấn nhưng không thể tạo giải thích.";

          structured = {
            query: sql,
            result: rows,
            answer: aiText
          };
        }
      } catch (err) {
        console.error("SQL Execution Error:", err);
        aiText = "Lỗi khi thực hiện truy vấn dữ liệu.";
        structured = { 
          error: "Lỗi SQL", 
          details: err.message 
        };
      }
      
      // Keep response structure consistent with other intents
      res.json({
        intent,
        raw: aiText,
        structured
      });
      return;
    }
    // Dự án tiết kiệm
    if (intent === "forecast") {
      try{
          let aiRaw = aiText.trim();
          aiRaw = aiRaw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
          let forecastData = null;
          try{
            const jsonStart = aiRaw.indexOf('{');
            const jsonEnd = aiRaw.lastIndexOf('}') + 1;
            aiRaw = aiRaw.slice(jsonStart, jsonEnd);
            forecastData = JSON.parse(aiRaw);
          }catch (e) {
            structured = { error: "Phân tích forecast thất bại", raw: aiRaw };
            return res.json({ intent, raw: aiRaw, structured });
          }

          // Kiểm tra dữ liệu cần thiết
          if (!forecastData?.sql || !forecastData?.goal_amount) {
              structured = { error: "Thiếu SQL hoặc goal_amount", raw: forecastData };
              return res.json({ intent, raw: aiRaw, structured });
          }

          // Thực thi SQL
          let rows = [];
          try {
            [rows] = await db.query(forecastData.sql);
          } catch (err) {
            structured = { error: "Lỗi khi chạy SQL", details: err.message };
            return res.json({ intent, raw: aiRaw, structured });
          }
          // Giai thich
          const explainPrompt = generateExplainPrompt({
            user_input,
            query_result: rows,
            goal_amount: forecastData.goal_amount
          });

          const explainData = await fetchWithFailover({
            contents: [{ parts: [{ text: explainPrompt }] }]
          });
           const finalAnswer = explainData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
                      || "Không thể tạo lời giải thích.";

          structured = {
            goal_amount: forecastData.goal_amount,
            sql: forecastData.sql,
            result: rows,
            answer: finalAnswer
          };


          return res.json({ intent, raw: finalAnswer, structured });

      }catch (err) {
        console.error("❌ Lỗi khi xử lý dự báo:", err);
        aiText = "Lỗi khi xử lý dự báo.";
        structured = { error: "Lỗi dự báo", details: err.message };
      }
    }


    console.log("Structured data:", structured);
    res.json({
      intent,
      raw: aiText,
      structured
    });
  } catch (error) {
    console.error("❌ handleChat error:", error.message);
    res.status(500).json({ error: `Lỗi xử lý AI: ${error.message}` });
  }
};


export const confirmTransaction = async (req, res) => {
  try {
    const { user_input, ai_suggested, user_corrected, confirmed, user_id } = req.body;

    if (!user_input || !ai_suggested) {
      return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    const transactions = Array.isArray(user_corrected)
      ? user_corrected
      : [user_corrected || ai_suggested.transactions?.[0]];

    if (!transactions.length) {
      return res.status(400).json({ error: "Không có giao dịch nào để lưu" });
    }

    // 👉 Tính tổng tiền
    const total_amount = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    // 👉 Lấy thông tin group
    const groupData = {
      user_id,
      group_name: ai_suggested.group_name || user_input,
      total_amount,
      transaction_date: ai_suggested.transaction_date || new Date().toISOString().split("T")[0],
    };

    let group_id = null;
    if (confirmed) {
      // 👉 Lưu group trước
      group_id = await createTransactionGroup(groupData);
    }

    for (const tx of transactions) {
      if (!tx) continue;

      const category_id = await getCategoryIdByKeyword(tx.category);
      if (!category_id) {
        return res.status(400).json({
          error: `Không tìm thấy danh mục "${tx.category}"`,
        });
      }

      const dbData = {
        user_id,
        group_id,
        amount: tx.amount,
        category_id,
        purpose_id: null,
        type: tx.type,
        description: tx.description || user_input,
        transaction_date: ai_suggested.transaction_date || new Date().toISOString().split("T")[0],
      };

      if (confirmed) {
        await addTransaction(dbData);
      }
    }

    res.status(200).json({
      success: true,
      message: confirmed
        ? "✅ Đã lưu nhóm giao dịch và các giao dịch thành công."
        : "⚠️ Giao dịch không được xác nhận.",
    });
  } catch (err) {
    console.error("❌ Lỗi khi lưu giao dịch:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};



export const processDocument = async (req, res) => {
  try {
    const file = req.file
    const user_id = req.body.user_id || null
    const now = new Date().toISOString().split("T")[0]

    if (!file) {
      return res.status(400).json({ error: "Không có file được gửi lên." })
    }

    const structured = await sendToBamlGemini(file.path)
    structured.user_id = user_id
    structured.transaction_date ||= now

    return res.status(200).json({
      intent: "transaction",
      raw: JSON.stringify(structured),
      structured,
      imageUrl: `/uploads/${file.filename}`,
      originalFilename: file.originalname
    })
  } catch (error) {
    console.error("❌ Lỗi xử lý BAML Gemini:", error)
    return res.status(500).json({ error: "Lỗi xử lý AI" })
  }
}