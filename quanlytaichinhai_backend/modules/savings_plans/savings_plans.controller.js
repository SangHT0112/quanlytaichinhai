// savings_plans.controller.js
import { getSavingsPlans, saveSavingsPlan, deleteSavingsPlan, updatePlansWithoutAI } from "./savings_plans.model.js";

export const getPlans = async (req, res) => {
  const { user_id, limit } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Thiếu user_id" });
  }

  try {
    const plans = await getSavingsPlans(user_id, parseInt(limit) || 50);
    res.json(plans);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách kế hoạch:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách kế hoạch" });
  }
};

export const savePlan = async (req, res) => {
  const { user_id, plan } = req.body;

  if (!user_id || !plan) {
    return res.status(400).json({ error: "Thiếu user_id hoặc plan không hợp lệ" });
  }

  // Kiểm tra dữ liệu đầu vào
  const isValidPlan = plan.id && plan.name && plan.targetAmount && plan.monthlyContribution && plan.timeToGoal && plan.priority && plan.category && plan.aiAnalysis;
  if (!isValidPlan) {
    return res.status(400).json({ error: "Dữ liệu kế hoạch không hợp lệ" });
  }

  const result = await saveSavingsPlan(user_id, plan);
  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Lỗi khi lưu kế hoạch" });
  }
};

export const deletePlan = async (req, res) => {
  const { user_id, plan_id } = req.body;

  if (!user_id || !plan_id) {
    return res.status(400).json({ error: "Thiếu user_id hoặc plan_id" });
  }

  try {
    const success = await deleteSavingsPlan(user_id, plan_id);
    if (success) {
      res.json({ success: true, message: "Đã xóa kế hoạch" });
    } else {
      res.status(404).json({ error: "Không tìm thấy hoặc không xóa được kế hoạch" });
    }
  } catch (error) {
    console.error("Lỗi khi xóa kế hoạch:", error);
    res.status(500).json({ error: "Lỗi khi xóa kế hoạch" });
  }
};

export const updatePlansOnLoad = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'Thiếu user_id' });
  }

  try {
    // Cập nhật các trường không cần AI
    const success = await updatePlansWithoutAI(user_id);
    if (!success) {
      return res.status(500).json({ error: 'Lỗi khi cập nhật kế hoạch' });
    }

    // Lấy danh sách kế hoạch mới nhất
    const plans = await getSavingsPlans(user_id);
    // Thêm progress_percentage vào mỗi kế hoạch
    const updatedPlans = plans.map(plan => ({
      ...plan,
      progressPercentage: ((plan.currentAmount / plan.targetAmount) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      message: 'Đã cập nhật kế hoạch khi vào trang',
      plans: updatedPlans
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật kế hoạch on load:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật kế hoạch' });
  }
};