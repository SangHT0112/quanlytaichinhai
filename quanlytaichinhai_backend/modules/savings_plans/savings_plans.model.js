// savings_plans.model.js
import db from "../../config/db.js";
import { fetchFinancialSummary } from "../overview/overview.model.js";
export const getSavingsPlans = async (userId) => {
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
       LIMIT 20`,
      [userId]
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
// Thêm hàm rebalance mới
export const rebalancePlans = async (userId) => {
  if (!userId) {
    console.error('Thiếu userId cho rebalance');
    return false;
  }

  try {
    await db.query('START TRANSACTION');

    // Lấy financial data
    const financialData = await fetchFinancialSummary(userId);
    const surplus = financialData.monthly_surplus || 0;
    const income = financialData.current_income || 0;
    if (surplus <= 0) {
      console.log(`Surplus <=0, bỏ qua rebalance cho user ${userId}`);
      await db.query('COMMIT');
      return true;
    }

    // Lấy tất cả plans (không nested data, chỉ cần basic)
    const [plansRows] = await db.execute(
      `SELECT id, target_amount, current_amount, monthly_contribution, priority, category 
       FROM savings_plans WHERE user_id = ?`,
      [userId]
    );
    const plans = plansRows.map(p => ({
      id: p.id,
      targetAmount: Number(p.target_amount),
      currentAmount: Number(p.current_amount),
      priority: p.priority,
      category: p.category
    }));

    if (!plans.length) {
      await db.query('COMMIT');
      return true;
    }

    // Tính weights (cơ bản + điều chỉnh theo category)
    const getAdjustedWeight = (priority, category) => {
      let weight = { high: 3, medium: 2, low: 1 }[priority] || 1;
      if (category === 'Quỹ khẩn cấp') weight += 1;  // Max 4
      else if (category === 'Phương tiện' && priority === 'high') weight += 0.5;  // 3.5
      else if (category === 'Học tập' && priority === 'high') weight += 0.5;  // 3.5
      else if (category === 'Mua sắm' && priority === 'low') weight -= 0.5;  // 0.5
      // Du lịch/Bất động sản: Giữ nguyên
      return Math.max(0.5, weight);  // Min 0.5 tránh 0
    };

    const weights = plans.map(p => getAdjustedWeight(p.priority, p.category));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight <= 0) {
      await db.query('COMMIT');
      return true;
    }

    // Tính base contribution
    const maxContribution = surplus < 3000000 ? income * 0.2 : income * 0.5;
    let base = Math.min(surplus, maxContribution);
    const lowSurplusLimit = surplus < 2000000 ? 1000000 : null;  // ≤1tr/plan nếu surplus<2tr

    // Rebalance cho từng plan
    const updateValues = plans.map((plan, index) => {
      const ratio = weights[index] / totalWeight;
      let newContribution = Math.round(base * ratio);
      if (lowSurplusLimit && newContribution > lowSurplusLimit) newContribution = lowSurplusLimit;

      const remaining = plan.targetAmount - plan.currentAmount;
      const newTimeToGoal = Math.max(1, Math.ceil(remaining / Math.max(1, newContribution)));  // Tránh chia 0

      return [newContribution, newTimeToGoal, plan.id];
    });

    // Batch update (hiệu quả hơn loop)
    for (const [newContribution, newTimeToGoal, planId] of updateValues) {
      await db.execute(
        `UPDATE savings_plans SET monthly_contribution = ?, time_to_goal = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        [newContribution, newTimeToGoal, planId, userId]
      );
    }

    await db.query('COMMIT');
    console.log(`Đã rebalance ${plans.length} kế hoạch cho user ${userId} (base: ${base.toLocaleString()} VND)`);
    return true;
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Lỗi rebalance plans:', error);
    return false;
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
    // Rebalance tất cả plans (bao gồm new)
    const rebalanceSuccess = await rebalancePlans(userId);
    if (!rebalanceSuccess) {
      console.error('Rebalance fail sau khi save plan mới');
      // Optional: Rollback insert? Nhưng đã commit, chỉ log
    }

    console.log(`Đã lưu và rebalance kế hoạch cho user ${userId}`);
    return true;
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

export const updatePlansWithoutAI = async (userId) => {
  if (!userId) {
    console.error('Thiếu userId');
    return false;
  }

  try {
    await db.query('START TRANSACTION');

    // Lấy dữ liệu tài chính
    let financialData;
    try {
      financialData = await fetchFinancialSummary(userId);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu tài chính:', error);
      financialData = {
        actual_balance: 0,
        monthly_surplus: 0,
        current_income: 0,
        current_expense: 0
      };
    }

    const plans = await getSavingsPlans(userId);
    if (!plans.length) {
      await db.query('COMMIT');
      return true;
    }

    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const totalWeight = plans.reduce(
      (sum, p) => sum + priorityWeights[p.priority],
      0
    );

    // Tổng số dư hiện tại và monthly_surplus
    let baseBalance = financialData.actual_balance || 0;
    const surplus = financialData.monthly_surplus || 0;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // ✅ Fix: Define currentDate

    // Track remaining balance for allocation (to avoid over-allocation)
    let remainingBalance = baseBalance;

    for (const plan of plans) {
      const weight = priorityWeights[plan.priority];
      const ratio = weight / totalWeight;

      // Số tiền hiện có trong plan
      const currentAmount = Number(plan.current_amount || 0);
      let newCurrentAmount = currentAmount;

      // Check if this is end-of-month update (only add surplus if last updated < current month)
      const lastUpdated = new Date(plan.updated_at || 0);
      const isNewMonth = lastUpdated.getMonth() < new Date().getMonth() || lastUpdated.getFullYear() < new Date().getFullYear();
      const shouldAddSurplus = isNewMonth || plan.updated_at === null; // ✅ Fix: Chỉ add surplus nếu tháng mới

      // ===== LOGIC CHÍNH =====
      if (currentAmount === 0 && plan.initial_amount === 0) {
        // Nếu lần đầu tạo → chia actual_balance (cap at remaining)
        const allocated = Math.min(remainingBalance * ratio, plan.target_amount); // ✅ Fix: Cap at target and remaining
        newCurrentAmount = allocated;
        remainingBalance -= allocated; // Update remaining
        // Lưu initial_amount để không dồn lại lần sau
        await db.execute(
          `UPDATE savings_plans SET initial_amount = ? WHERE id = ? AND user_id = ?`,
          [allocated, plan.id, userId]
        );
      } 

      // Luôn cộng surplus nếu end-month (cho cả new/existing)
      if (shouldAddSurplus) {
        const surplusAllocated = Math.min(surplus * ratio, plan.target_amount - newCurrentAmount); // ✅ Fix: Cap at target - current
        newCurrentAmount += surplusAllocated;
      }

      // Cap final at target_amount
      newCurrentAmount = Math.min(newCurrentAmount, plan.target_amount); // ✅ Fix: Không vượt target

      // Milestones
      await db.execute(`DELETE FROM milestones WHERE plan_id = ?`, [plan.id]);
      const milestoneSteps = [0.25, 0.5, 0.75, 1]; // ✅ Suggest: 25/50/75/100% thay 20/40/...
      const milestoneValues = milestoneSteps.map(step => {
        const amount = plan.target_amount * step;
        const remaining = Math.max(0, amount - newCurrentAmount);
        const months = plan.monthly_contribution > 0 ? Math.ceil(remaining / plan.monthly_contribution) : 0; // ✅ Fix: ceil cho accuracy
        const timeframe = months > 0 ? `${months} tháng` : 'Hoàn thành';
        return [plan.id, amount, timeframe, `Đạt ${step * 100}% mục tiêu`];
      });
      if (milestoneValues.length > 0) {
        await db.query(
          `INSERT INTO milestones (plan_id, amount, timeframe, description) VALUES ?`,
          [milestoneValues]
        );
      }

      // Breakdowns (thêm default)
      await db.execute(`DELETE FROM breakdowns WHERE plan_id = ?`, [plan.id]);
      let breakdown = {};
      switch (plan.category) { // ✅ Fix: Switch cho clean
        case 'Phương tiện':
          breakdown = {
            'Giá xe': plan.target_amount * 0.85,
            'Phí': plan.target_amount * 0.05,
            'Bảo hiểm': plan.target_amount * 0.05,
            'Dự phòng': plan.target_amount * 0.05
          };
          break;
        case 'Bất động sản':
          breakdown = {
            'Giá nhà': plan.target_amount * 0.85,
            'Phí': plan.target_amount * 0.05,
            'Nội thất': plan.target_amount * 0.05,
            'Dự phòng': plan.target_amount * 0.05
          };
          break;
        case 'Du lịch':
          breakdown = {
            'Chi phí chính': plan.target_amount * 0.8,
            'Dự phòng': plan.target_amount * 0.2
          };
          break;
        case 'Quỹ khẩn cấp':
          breakdown = {
            'Quỹ': plan.target_amount * 1.0
          };
          break;
        default: // ✅ Fix: Default cho category lạ
          breakdown = {
            'Chính': plan.target_amount * 0.9,
            'Dự phòng': plan.target_amount * 0.1
          };
      }
      const breakdownValues = Object.entries(breakdown).map(([item_key, amount]) => [
        plan.id,
        item_key,
        Number(amount)
      ]);
      if (breakdownValues.length > 0) {
        await db.query(
          `INSERT INTO breakdowns (plan_id, item_key, amount) VALUES ?`,
          [breakdownValues]
        );
      }

      // Update plan
      await db.execute(
        `UPDATE savings_plans SET current_amount = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
        [newCurrentAmount, currentDate, plan.id, userId]
      );
    }

    await db.query('COMMIT');
    console.log(`Đã cập nhật kế hoạch cho user ${userId}`);
    return true;
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Lỗi khi cập nhật kế hoạch:', error);
    return false;
  }
};















