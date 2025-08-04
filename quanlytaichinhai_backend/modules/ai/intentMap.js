import { parseJsonFromText } from './utils/parseAIJson.js';
import { generateTransactionPrompt } from './prompts/transactionPrompt.js';
import { generateComponentPrompt } from './prompts/componentPrompt.js';
import { generateNaturalPrompt } from './prompts/naturalPrompt.js';
import { generateFollowupPrompt } from './prompts/generateFollowupPrompt.js';
import { generateAmountPrompt } from './prompts/generateAmountPrompt.js';
import { generateExplainPrompt } from './prompts/sqlPrompts/generateExplainPrompt.js';
import { generateSQLPrompt } from './prompts/sqlPrompts/generateSQLPrompt.js';
import { generateForecastSQLPrompt } from './prompts/sqlPrompts/generateForecastSQLPrompt.js';
import { generateImagePrompt } from './prompts/generateImagePrompt.js';
import db from '../../config/db.js';
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { translateWithGemini } from './utils/translateWithGemini.js';
import { fetchWithFailover } from './utils/fetchWithFailover.js';

import { fetchStabilityAI } from './utils/fetchStabilityAI.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const processTransactionResponse = async (aiText, { user_input, now, user_id, historyText }) => {
  const parsed = parseJsonFromText(aiText, { fallback: null });
  if (!parsed) {
    return {
      raw: 'Không thể phân tích dữ liệu giao dịch.',
      structured: {
        group_name: null,
        transaction_date: now,
        user_id,
        transactions: [],
        error: 'JSON không hợp lệ',
      },
    };
  }

  if (parsed.response_type === 'natural' && parsed.message) {
    return {
      raw: parsed.message,
      structured: {
        message: parsed.message,
        response_type: 'natural',
        requires_more_info: true,
        intent: 'transaction',
      },
    };
  }

  const structured = {
    group_name: parsed.group_name || parsed.transactions?.[0]?.description || null,
    transaction_date: parsed.transaction_date || now,
    user_id: parsed.user_id || user_id,
    transactions: Array.isArray(parsed.transactions)
      ? parsed.transactions.map(tx => ({ ...tx, amount: Number(tx.amount) || 0 }))
      : Array.isArray(parsed)
      ? parsed.map(tx => ({ ...tx, amount: Number(tx.amount) || 0 }))
      : [{ ...parsed, amount: Number(parsed.amount) || 0 }],
  };

  return { structured };
};

const genericJsonProcessor = async (aiText) => {
  const parsed = parseJsonFromText(aiText, { fallback: null });
  return parsed ? { structured: parsed } : { structured: { error: 'JSON không hợp lệ' } };
};

export const intentMap = {
  transaction: {
    generatePrompt: generateTransactionPrompt,
    isJsonResponse: true,
    processResponse: processTransactionResponse,
  },
  amount: {
    generatePrompt: generateAmountPrompt,
    isJsonResponse: true,
    processResponse: processTransactionResponse,
  },
  component: {
    generatePrompt: generateComponentPrompt,
    isJsonResponse: true,
    processResponse: genericJsonProcessor,
  },
  sql_query: {
    generatePrompt: generateSQLPrompt,
    isJsonResponse: false,
    processResponse: async (aiText, { user_input, historyText }) => {
      try {
        let sql = aiText.replace(/^```sql\s*/i, '').replace(/```$/i, '').trim();
        if (sql === 'INVALID_SQL' || !sql.toLowerCase().startsWith('select')) {
          return { structured: { error: 'Chỉ hỗ trợ truy vấn SELECT.' } };
        }

        const rows = await db.query(sql);
        const explainPrompt = generateExplainPrompt({ user_input, query_result: rows });
        const explainData = await fetchWithFailover({
          contents: [{ parts: [{ text: explainPrompt }] }],
        });

        const explanation =
          explainData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          'Không thể tạo giải thích.';
        return {
          structured: { query: sql, result: rows, answer: explanation },
          raw: explanation,
        };
      } catch (err) {
        console.error('SQL Execution Error:', err);
        return {
          structured: { error: 'Lỗi SQL', details: err.message },
          raw: 'Lỗi khi thực hiện truy vấn dữ liệu.',
        };
      }
    },
  },
  forecast: {
    generatePrompt: generateForecastSQLPrompt,
    isJsonResponse: true,
    processResponse: async (aiText, { user_input, now, user_id }) => {
      const parsed = parseJsonFromText(aiText, { fallback: null });
      if (!parsed || !parsed.sql || !parsed.goal_amount) {
        return {
          structured: { error: 'Thiếu SQL hoặc goal_amount', raw: parsed },
          raw: 'Lỗi khi xử lý dự báo.',
        };
      }

      try {
        const [rows] = await db.query(parsed.sql);
        const explainPrompt = generateExplainPrompt({
          user_input,
          query_result: rows,
          goal_amount: parsed.goal_amount,
        });

        const explainData = await fetchWithFailover({
          contents: [{ parts: [{ text: explainPrompt }] }],
        });

        const finalAnswer =
          explainData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          'Không thể tạo lời giải thích.';

        return {
          structured: {
            goal_amount: parsed.goal_amount,
            sql: parsed.sql,
            result: rows,
            answer: finalAnswer,
          },
          raw: finalAnswer,
        };
      } catch (err) {
        console.error('❌ Lỗi khi xử lý dự báo:', err);
        return {
          structured: { error: 'Lỗi dự báo', details: err.message },
          raw: 'Lỗi khi xử lý dự báo.',
        };
      }
    },
  },
  followup: {
    generatePrompt: generateFollowupPrompt,
    isJsonResponse: false,
    processResponse: async (aiText) => ({ raw: aiText }),
  },
  generate_image: {
    generatePrompt: generateImagePrompt,
    isJsonResponse: false,
    processResponse: async (aiText, { user_input }) => {
      try {
        // ✨ Dịch tiếng Việt sang tiếng Anh (có thể cải thiện prompt)
        const translatedPrompt = await translateWithGemini(user_input);

        if (!translatedPrompt) {
          return {
            raw: "Không thể dịch prompt tiếng Việt.",
            structured: { error: "Gemini translation failed" },
          };
        }

        // 🖼️ Gọi Stability AI với prompt tiếng Anh đã dịch
        const imageBuffer = await fetchStabilityAI(translatedPrompt);

        const dir = path.join(process.cwd(), 'public', 'generated_images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filename = `generated_image_${Date.now()}.png`;
        const imagePath = path.join(dir, filename);

        fs.writeFileSync(imagePath, imageBuffer);

        return {
          raw: "Hình ảnh đã được tạo thành công.",
          structured: {
            image_path: `/generated_images/${filename}`,
            original_prompt: user_input,
            translated_prompt: translatedPrompt,
          },
        };
      } catch (error) {
        return {
          raw: "Lỗi khi tạo hình ảnh.",
          structured: { error: error.message },
        };
      }
    },
  },
  natural: {
    generatePrompt: generateNaturalPrompt,
    isJsonResponse: false,
    processResponse: async (aiText) => {
      const parsed = parseJsonFromText(aiText, { fallback: null, throwOnError: false });
      if (parsed && parsed.response_type === 'natural' && parsed.message) {
        return {
          raw: parsed.message,
          structured: { message: parsed.message },
        };
      }
      return {
        raw: aiText,
        structured: { message: aiText },
      };
    },
  },
};