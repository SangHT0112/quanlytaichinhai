
import { getCategoryIdByKeyword } from "../category/category.model.js"
import { addTransaction, createTransactionGroup } from "../transaction/transaction.model.js"
import { fetchWithFailover } from "./utils/fetchWithFailover.js"
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import { sendToBamlGemini } from "./sendToBamlGemini.js"
import {intentMap} from "./intentMap.js"
import { saveSavingsPlan } from "../savings_plans/savings_plans.model.js";
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



export const handleChat = async (req, res) => {
  const { user_id, message: user_input = "", history = [], response_type } = req.body;
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

  if (!user_id || (!user_input && !response_type)) {
    return res.status(400).json({ error: 'Thiếu user_id hoặc user_input/response_type' });
  }

  const historyText = history
    .map((msg) =>
      msg.role === "user"
        ? `Người dùng: ${msg.content}`
        : `AI: ${msg.content}${msg.structured ? `\n(JSON: ${JSON.stringify(msg.structured)})` : ""}`
    )
    .join("\n");

  try {
    const classifyPromptPath = path.resolve(__dirname, "./documents/ai_prompt_classify.txt");
    const classifyBasePrompt = fs.readFileSync(classifyPromptPath, "utf-8");
    const classifyPrompt = classifyBasePrompt.replace("${user_input}", user_input);

    const classifyData = await fetchWithFailover({
      contents: [{ parts: [{ text: classifyPrompt }] }],
    });

    const rawIntent = classifyData.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    const intent = Object.keys(intentMap).includes(rawIntent) ? rawIntent : "natural";

    const { generatePrompt, isJsonResponse, processResponse } = intentMap[intent];
    const prompt = await generatePrompt({ user_input, now, user_id, historyText });

    const geminiData = await fetchWithFailover({
      contents: [
        {
          parts: [
            {
              text: isJsonResponse
                ? `${prompt}\nTrả về chỉ JSON hợp lệ, không thêm văn bản giải thích hay ký tự thừa như markdown.`
                : prompt,
            },
          ],
        },
      ],
    });

    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Không nhận được phản hồi từ AI.";
    console.log("Phản hồi từ Gemini:", aiText);

    const { raw = aiText, structured = null } = await processResponse(aiText, {
      user_input,
      now,
      user_id,
      historyText,
    });

    return res.json({
      intent,
      raw,
      structured,
    });
  } catch (error) {
    console.error("❌ handleChat error:", error.message);
    return res.status(500).json({ error: `Lỗi xử lý AI: ${error.message}` });
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

    // Kiểm tra transactions
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "Không có giao dịch nào để lưu" });
    }

    // Kiểm tra từng transaction
    const validTransactions = transactions.filter(tx => tx && typeof tx === 'object' && typeof tx.amount === 'number');
    if (validTransactions.length === 0) {
      return res.status(400).json({ error: "Dữ liệu giao dịch không hợp lệ hoặc thiếu amount" });
    }

    // Tính tổng tiền
    const total_amount = validTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Lấy thông tin group
    const groupData = {
      user_id,
      group_name: ai_suggested.group_name || user_input,
      total_amount,
      transaction_date: ai_suggested.transaction_date || new Date().toISOString().split("T")[0],
    };

    let group_id = null;
    if (confirmed) {
      group_id = await createTransactionGroup(groupData);
    }

    for (const tx of validTransactions) {
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


// Xác nhận mức ưu tiên
// Xác nhận mức ưu tiên
export const confirmPriority = async (req, res) => {
  const { user_id, selected_priority, temp_plans } = req.body;

  if (!user_id || !selected_priority || !temp_plans) {
    return res.status(400).json({ error: 'Thiếu dữ liệu' });
  }

  if (!['high', 'medium', 'low'].includes(selected_priority)) {
    return res.status(400).json({ error: 'Mức ưu tiên không hợp lệ' });
  }

  try {
    const structuredPlans = temp_plans.map(plan => ({
      ...plan,
      priority: selected_priority,
    }));
    console.log('temp_plans:', temp_plans);
    console.log('structuredPlans:', structuredPlans);
    const results = await Promise.all(
      structuredPlans.map(async (plan) => {
        const success = await saveSavingsPlan(user_id, plan);
        return { plan_id: plan.id, success };
      })
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.error("Lỗi khi lưu một số kế hoạch:", failed);
      return res.status(500).json({
        error: 'Lỗi khi lưu một số kế hoạch',
        details: failed.map((f) => `Plan ${f.plan_id} failed`),
      });
    }

    return res.json({
      success: true,
      raw: `Kế hoạch đã được lưu với mức ưu tiên: ${selected_priority}.`,
      structured: { plans: structuredPlans },
      redirectPath: '/financial_plan',
    });
  } catch (err) {
    console.error("❌ confirmPriority error:", err.message);
    return res.status(500).json({ error: 'Lỗi khi xác nhận mức ưu tiên' });
  }
};