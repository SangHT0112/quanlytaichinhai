// savings_plans.model.js
import db from "../../config/db.js";

export const getSavingsPlans = async (userId, limit = 50) => {
  if (!userId) {
    console.error("Thiếu userId");
    return [];
  }

  try {
    // Lấy tất cả kế hoạch tiết kiệm và các thông tin liên quan
    const [plans] = await db.execute(
      `SELECT 
         sp.id,
         sp.user_id,
         sp.name,
         sp.description,
         sp.target_amount,
         sp.current_amount,
         sp.monthly_contribution,
         sp.time_to_goal,
         sp.priority,
         sp.category,
         aa.feasibility_score,
         aa.risk_level,
         aa.monthly_breakdown_current_savings,
         aa.monthly_breakdown_optimized_savings,
         aa.monthly_breakdown_with_investment
       FROM savings_plans sp
       LEFT JOIN ai_analyses aa ON sp.id = aa.plan_id
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    // Lấy dữ liệu lồng nhau (breakdowns, recommendations, milestones, challenges, tips)
    const result = await Promise.all(
      plans.map(async (plan) => {
        const [breakdowns] = await db.execute(
          `SELECT item_key, amount FROM breakdowns WHERE plan_id = ?`,
          [plan.id]
        );
        const [recommendations] = await db.execute(
          `SELECT type, title, description, impact, priority FROM recommendations WHERE plan_id = ?`,
          [plan.id]
        );
        const [milestones] = await db.execute(
          `SELECT amount, timeframe, description FROM milestones WHERE plan_id = ?`,
          [plan.id]
        );
        const [challenges] = await db.execute(
          `SELECT challenge FROM challenges WHERE plan_id = ?`,
          [plan.id]
        );
        const [tips] = await db.execute(
          `SELECT tip FROM tips WHERE plan_id = ?`,
          [plan.id]
        );

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          targetAmount: plan.target_amount,
          currentAmount: plan.current_amount,
          monthlyContribution: plan.monthly_contribution,
          timeToGoal: plan.time_to_goal,
          priority: plan.priority,
          category: plan.category,
          breakdown: breakdowns.reduce((acc, b) => ({ ...acc, [b.item_key]: b.amount }), {}),
          aiAnalysis: {
            feasibilityScore: plan.feasibility_score,
            riskLevel: plan.risk_level,
            recommendations: recommendations.map((r) => ({
              type: r.type,
              title: r.title,
              description: r.description,
              impact: r.impact,
              priority: r.priority,
            })),
            milestones: milestones.map((m) => ({
              amount: m.amount,
              timeframe: m.timeframe,
              description: m.description,
            })),
            monthlyBreakdown: {
              currentSavings: plan.monthly_breakdown_current_savings,
              optimizedSavings: plan.monthly_breakdown_optimized_savings,
              withInvestment: plan.monthly_breakdown_with_investment,
            },
            challenges: challenges.map((c) => c.challenge),
            tips: tips.map((t) => t.tip),
          },
        };
      })
    );

    return result;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách kế hoạch tiết kiệm:", error);
    return [];
  }
};

export const saveSavingsPlan = async (userId, plan) => {
  if (!userId || !plan) {
    console.error('Thiếu userId hoặc plan:', { userId, plan });
    return false;
  }

  const {
      id,
      name = 'Kế hoạch không tên',
      description = '',
      target_amount: targetAmount = 0,
      current_amount: currentAmount = 0,
      monthly_contribution: monthlyContribution = 0,
      time_to_goal: timeToGoal = 0,
      priority, // Không đặt giá trị mặc định
      category = 'Tiết kiệm',
      breakdown = {},
      ai_analysis: aiAnalysis = {}
    } = plan;

    // Kiểm tra priority hợp lệ
    if (!['high', 'medium', 'low'].includes(priority)) {
      console.error('Priority không hợp lệ:', priority);
      return false;
    }

  // Kiểm tra nếu kế hoạch đã tồn tại dựa trên id và userId
  if (id) {
    try {
      const [existing] = await db.query(
        `SELECT id FROM savings_plans WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      if (existing.length > 0) {
        console.log(`Kế hoạch ${id} đã tồn tại cho user ${userId}, bỏ qua lưu mới`);
        return true; // Trả về true để coi như thành công (không lưu lần 2)
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra tồn tại kế hoạch:', error);
      return false;
    }
  }

  try {
    await db.query('START TRANSACTION');

    // Lưu vào bảng savings_plans
    await db.execute(
          `INSERT INTO savings_plans 
            (id, user_id, name, description, target_amount, current_amount, monthly_contribution, time_to_goal, priority, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            target_amount = VALUES(target_amount),
            current_amount = VALUES(current_amount),
            monthly_contribution = VALUES(monthly_contribution),
            time_to_goal = VALUES(time_to_goal),
            priority = VALUES(priority),
            category = VALUES(category)`,
          [
            id ?? `plan_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            userId,
            name,
            description ?? null,
            Number(targetAmount) ?? 0,
            Number(currentAmount) ?? 0,
            Number(monthlyContribution) ?? 0,
            Number(timeToGoal) ?? 0,
            priority, // Sử dụng giá trị priority trực tiếp
            category ?? 'Tiết kiệm'
          ]
        );
    // Xóa dữ liệu cũ liên quan
    await db.execute(`DELETE FROM breakdowns WHERE plan_id = ?`, [id]);
    await db.execute(`DELETE FROM ai_analyses WHERE plan_id = ?`, [id]);
    await db.execute(`DELETE FROM recommendations WHERE plan_id = ?`, [id]);
    await db.execute(`DELETE FROM milestones WHERE plan_id = ?`, [id]);
    await db.execute(`DELETE FROM challenges WHERE plan_id = ?`, [id]);
    await db.execute(`DELETE FROM tips WHERE plan_id = ?`, [id]);

    // Lưu breakdown
    const breakdownValues = Object.entries(breakdown).map(([item_key, amount]) => [
      id,
      item_key,
      Number(amount) ?? 0
    ]);
    if (breakdownValues.length > 0) {
      await db.query(
        `INSERT INTO breakdowns (plan_id, item_key, amount) VALUES ?`,
        [breakdownValues]
      );
    }

    // Lưu ai_analysis
    await db.execute(
      `INSERT INTO ai_analyses 
        (plan_id, feasibility_score, risk_level, monthly_breakdown_current_savings, monthly_breakdown_optimized_savings, monthly_breakdown_with_investment)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        Number(aiAnalysis.feasibility_score) ?? 80,
        aiAnalysis.risk_level ?? 'medium',
        Number(aiAnalysis.monthly_breakdown?.current_savings) ?? 0,
        Number(aiAnalysis.monthly_breakdown?.optimized_savings) ?? 0,
        Number(aiAnalysis.monthly_breakdown?.with_investment) ?? 0
      ]
    );

    // Lưu recommendations
    const recommendationValues = (aiAnalysis.recommendations ?? []).map((rec) => [
      id,
      rec.type ?? 'unknown',
      rec.title ?? 'Gợi ý không tên',
      rec.description ?? null,
      rec.impact ?? null,
      rec.priority ?? 'medium'
    ]);
    if (recommendationValues.length > 0) {
      await db.query(
        `INSERT INTO recommendations (plan_id, type, title, description, impact, priority) VALUES ?`,
        [recommendationValues]
      );
    }

    // Lưu milestones
    const milestoneValues = (aiAnalysis.milestones ?? []).map((m) => [
      id,
      Number(m.amount) ?? 0,
      m.timeframe ?? 'Không xác định',
      m.description ?? null
    ]);
    if (milestoneValues.length > 0) {
      await db.query(
        `INSERT INTO milestones (plan_id, amount, timeframe, description) VALUES ?`,
        [milestoneValues]
      );
    }

    // Lưu challenges
    const challengeValues = (aiAnalysis.challenges ?? []).map((c) => [id, c ?? 'Không xác định']);
    if (challengeValues.length > 0) {
      await db.query(`INSERT INTO challenges (plan_id, challenge) VALUES ?`, [challengeValues]);
    }

    // Lưu tips
    const tipValues = (aiAnalysis.tips ?? []).map((t) => [id, t ?? 'Không xác định']);
    if (tipValues.length > 0) {
      await db.query(`INSERT INTO tips (plan_id, tip) VALUES ?`, [tipValues]);
    }

    await db.query('COMMIT');
    console.log(`Đã lưu kế hoạch ${id} cho user ${userId}`);
    return true;
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(`Lỗi khi lưu kế hoạch ${id}:`, error);
    return false;
  }
};


export const deleteSavingsPlan = async (userId, planId) => {
  if (!userId || !planId) {
    console.error("Thiếu userId hoặc planId");
    return false;
  }

  try {
    await db.query("START TRANSACTION");

    // Xóa dữ liệu liên quan trước
    await db.execute(`DELETE FROM breakdowns WHERE plan_id = ?`, [planId]);
    await db.execute(`DELETE FROM recommendations WHERE plan_id = ?`, [planId]);
    await db.execute(`DELETE FROM milestones WHERE plan_id = ?`, [planId]);
    await db.execute(`DELETE FROM challenges WHERE plan_id = ?`, [planId]);
    await db.execute(`DELETE FROM tips WHERE plan_id = ?`, [planId]);
    await db.execute(`DELETE FROM ai_analyses WHERE plan_id = ?`, [planId]);

    // Xóa kế hoạch chính (đảm bảo thuộc về userId)
    const [result] = await db.execute(
      `DELETE FROM savings_plans WHERE id = ? AND user_id = ?`,
      [planId, userId]
    );

    await db.query("COMMIT");

    // Kiểm tra số dòng bị ảnh hưởng
    return result.affectedRows > 0;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error(`Lỗi khi xóa kế hoạch ${planId}:`, error);
    return false;
  }
};