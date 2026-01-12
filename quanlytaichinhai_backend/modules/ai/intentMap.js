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
import { generatePlanningPrompt } from './prompts/generatePlanningPrompt.js';
import { generateCreateCategoryPrompt } from './prompts/generateCreateCategoryPrompt.js';
import { deleteAllTransactionsByUser } from '../transaction/transaction.model.js';
import { deleteAllSavingsPlansByUser } from '../savings_plans/savings_plans.model.js';
import { saveSavingsPlan } from '../savings_plans/savings_plans.model.js';
import db from '../../config/db.js';
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { translateWithGemini } from './utils/translateWithGemini.js';
import { fetchWithFailover } from './utils/fetchWithFailover.js';

import cloudinary from '../../config/cloudinary.js';
import streamifier from 'streamifier'; // mới cần

import { fetchStabilityAI } from './utils/fetchStabilityAI.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const processTransactionResponse = async (aiText, { user_input, now, user_id }) => {
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

  if (parsed.response_type === 'suggest_new_category') {
      return {
        raw: parsed.message,
        structured: {
          response_type: 'suggest_new_category',
          message: parsed.message,
          suggest_new_category: parsed.suggest_new_category,
          temporary_transaction: parsed.temporary_transaction,
        },
      };
  }

  const structured = {
    group_name: parsed.group_name || parsed.temporary_transaction?.group_name || parsed.transactions?.[0]?.description || user_input,
    transaction_date: parsed.transaction_date || parsed.temporary_transaction?.transaction_date || now,
    user_id: parsed.user_id || user_id,
    transactions: Array.isArray(parsed.transactions)
      ? parsed.transactions.map(tx => ({ ...tx, amount: Number(tx.amount) || 0 }))
      : Array.isArray(parsed.temporary_transaction?.transactions)
      ? parsed.temporary_transaction.transactions.map(tx => ({ ...tx, amount: Number(tx.amount) || 0 }))
      : [{ ...parsed, amount: Number(parsed.amount) || 0 }],
  };

  return { raw: parsed.message || aiText, structured };
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
          const translatedPrompt = await translateWithGemini(user_input);
          if (!translatedPrompt) {
            return {
              raw: "Không thể dịch prompt tiếng Việt.",
              structured: { error: "Gemini translation failed" },
            };
          }

          const imageBuffer = await fetchStabilityAI(translatedPrompt);

          // 👉 Upload buffer lên Cloudinary
          const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'generated_images' },
                (error, result) => {
                  if (result) resolve(result);
                  else reject(error);
                }
              );
              streamifier.createReadStream(buffer).pipe(uploadStream);
            });
          };

          const result = await uploadFromBuffer(imageBuffer);

          return {
            raw: "Hình ảnh đã được tạo và lưu trên Cloudinary.",
            structured: {
              image_url: result.secure_url,
              cloudinary_id: result.public_id,
              original_prompt: user_input,
              translated_prompt: translatedPrompt,
            },
          };
        } catch (error) {
          console.error('Upload to Cloudinary error:', error);
          return {
            raw: "Lỗi khi tạo hoặc lưu hình ảnh.",
            structured: { error: error.message },
          };
        }
      },
    },
  create_category: {
    generatePrompt: generateCreateCategoryPrompt,
    isJsonResponse: true,
    processResponse: async (aiText, { user_input, now, user_id }) => {
      const parsed = parseJsonFromText(aiText, { fallback: null });
      if (!parsed) {
        return {
          raw: 'Không thể phân tích dữ liệu danh mục.',
          structured: {
            error: 'JSON không hợp lệ',
          },
        };
      }

      // Lấy dữ liệu từ parsed (AI trả về)
      if (parsed.name && parsed.type) {
        return {
          raw: `Đã đề xuất danh mục mới '${parsed.name}'.`,
          structured: {
            response_type: 'suggest_new_category',
            suggest_new_category: {
              name: parsed.name.trim(),
              type: parsed.type,
              parent_id: null,
              icon: parsed.icon || null, // ✅ lấy icon từ AI, chỉ fallback null nếu AI không có
            },
            temporary_transaction: {
              user_id: parsed.user_id ?? user_id,
              type: parsed.type,
              category: parsed.name.trim(),
              amount: 0,
              description: user_input,
              transaction_date: now,
            },
            message: `Đã đề xuất danh mục mới '${parsed.name.trim()}'. Chờ phê duyệt.`,
          },
        };
      }

      return {
        raw: 'Không thể nhận diện yêu cầu tạo danh mục.',
        structured: { error: 'Yêu cầu không hợp lệ' },
      };
    },
  },
 planning: {
    generatePrompt: generatePlanningPrompt,
    isJsonResponse: true,
    processResponse: async (aiText, { user_input, now, user_id }) => {
      const parsed = parseJsonFromText(aiText, { fallback: null });
      if (!parsed || !parsed.plans || !Array.isArray(parsed.plans) || parsed.plans.length === 0) {
        return {
          raw: 'Không thể phân tích dữ liệu kế hoạch.',
          structured: {
            error: 'JSON không hợp lệ hoặc thiếu plans',
          },
        };
      }

      // ✅ Giả sử chỉ 1 kế hoạch mỗi lần (lấy plans[0]), theo gợi ý user
      const plan = parsed.plans[0]; // Chỉ xử lý plan đầu tiên
      const planData = {
        id: plan.id || `plan_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_id: user_id,
        name: plan.name || user_input || 'Kế hoạch không tên',
        description: plan.description ?? null,
        target_amount: Number(plan.target_amount) ?? 0,
        current_amount: Number(plan.current_amount) ?? 0,
        monthly_contribution: Number(plan.monthly_contribution) ?? 0,
        time_to_goal: Number(plan.time_to_goal) ?? 0,
        priority: plan.priority || 'medium', // Sử dụng priority do AI phân tích và chọn
        category: plan.category || 'Tiết kiệm',
        breakdown: plan.breakdown ?? {},
        ai_analysis: {
          feasibility_score: Number(plan.ai_analysis?.feasibility_score) ?? 80,
          risk_level: plan.ai_analysis?.risk_level || 'medium',
          recommendations: Array.isArray(plan.ai_analysis?.recommendations)
            ? plan.ai_analysis.recommendations.map(rec => ({
                type: rec.type ?? 'unknown',
                title: rec.title ?? 'Gợi ý không tên',
                description: rec.description ?? null,
                impact: rec.impact ?? null,
                priority: rec.priority ?? 'medium'
              }))
            : [],
          milestones: Array.isArray(plan.ai_analysis?.milestones)
            ? plan.ai_analysis.milestones.map(m => ({
                amount: Number(m.amount) ?? 0,
                timeframe: m.timeframe ?? 'Không xác định',
                description: m.description ?? null
              }))
            : [],
          monthly_breakdown: {
            current_savings: Number(plan.ai_analysis?.monthly_breakdown?.current_savings) ?? 0,
            optimized_savings: Number(plan.ai_analysis?.monthly_breakdown?.optimized_savings) ?? 0,
            with_investment: Number(plan.ai_analysis?.monthly_breakdown?.with_investment) ?? 0
          },
          challenges: Array.isArray(plan.ai_analysis?.challenges)
            ? plan.ai_analysis.challenges.map(c => c ?? 'Không xác định')
            : [],
          tips: Array.isArray(plan.ai_analysis?.tips)
            ? plan.ai_analysis.tips.map(t => t ?? 'Không xác định')
            : []
        },
        created_at: now
      };

      // ✅ Tích hợp gọi saveSavingsPlan cho single plan
      const saveResult = await saveSavingsPlan(user_id, planData);
      const saveStatus = saveResult ? 'thành công' : 'thất bại';

      // Xây dựng thông báo phản hồi
      const successMsg = `✅ Đã tạo và lưu kế hoạch tiết kiệm "${planData.name}" với mức ưu tiên do AI phân tích: ${planData.priority}.`;
      const errorMsg = !saveResult ? ` ⚠️ Lỗi lưu kế hoạch: "${planData.name}".` : '';

      return {
        raw: `${successMsg}${errorMsg}`,
        structured: {
          response_type: 'plan_created',
          plan: planData, // Trả về single plan để frontend xử lý (e.g., redirect hoặc hiển thị)
          saved: saveResult,
          message: `Kế hoạch đã được lưu và ưu tiên theo phân tích AI (${saveStatus}).`,
        },
      };
    }
  },
  delete_data: {
    generatePrompt: async ({ user_input, now, user_id, historyText }) => {
      // Prompt đơn giản để AI xác nhận (có thể dùng Gemini để generate message xác nhận)
      return `Người dùng yêu cầu xóa hết dữ liệu chi tiêu. Hãy trả về JSON xác nhận hành động, với message cảnh báo và lý do (nếu cần). 
      JSON format: {
        "response_type": "delete_data",
        "message": "Xác nhận xóa dữ liệu. Ví dụ: 'Bạn có chắc chắn muốn xóa hết dữ liệu chi tiêu? Hành động này không thể hoàn tác.'",
        "confirm_required": true  // Để frontend yêu cầu confirm trước khi xóa
      }`;
    },
    isJsonResponse: true,
    processResponse: async (aiText, { user_input, now, user_id, historyText }) => {
      const parsed = parseJsonFromText(aiText, { fallback: null });
      if (!parsed || parsed.response_type !== 'delete_data') {
        return {
          raw: 'Không thể xử lý yêu cầu xóa dữ liệu.',
          structured: { error: 'JSON không hợp lệ' },
        };
      }

      // Nếu cần confirm (tùy frontend), trả về message xác nhận trước
      if (parsed.confirm_required) {
        return {
          raw: parsed.message || 'Bạn có chắc chắn muốn xóa hết dữ liệu chi tiêu? Hành động này không thể hoàn tác.',
          structured: {
            response_type: 'delete_data_confirm',
            message: parsed.message,
            requires_confirm: true,
          },
        };
      }

      // Thực hiện xóa dữ liệu (sau khi confirm từ frontend)
      try {
        // Xóa transactions
        const deletedTx = await deleteAllTransactionsByUser(user_id);
        
        // Xóa savings plans
        const deletedPlans = await deleteAllSavingsPlansByUser(user_id);
        
        // Xóa categories user-specific nếu có (comment nếu không cần)
        // const deletedCats = await deleteUserCategories(user_id);

        const totalDeleted = deletedTx + deletedPlans; // + deletedCats nếu có

        return {
          raw: `Đã xóa thành công ${totalDeleted} bản ghi dữ liệu chi tiêu của bạn. Dữ liệu đã được reset hoàn toàn.`,
          structured: {
            response_type: 'delete_data_success',
            deleted_count: totalDeleted,
            message: 'Dữ liệu chi tiêu đã được xóa vĩnh viễn.',
          },
        };
      } catch (err) {
        console.error('Lỗi xóa dữ liệu:', err);
        return {
          raw: 'Lỗi khi xóa dữ liệu. Vui lòng thử lại.',
          structured: { error: err.message },
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