// src/data/financialData.ts

export const financialData = {
  currentBalance: 15750000,
  monthlyIncome: 12000000,
  monthlyExpenses: 8500000,
  monthlySavings: 3500000,

  // 🎯 Mục tiêu tài chính chính
  savingsGoals: [
    {
      id: 1,
      name: "Du lịch Nhật Bản",
      target: 50000000,
      current: 18500000,
      deadline: "2024-12-31",
      priority: "high",
    },
  ],

  // 💸 Chi tiêu thực tế
  expenseCategories: [
    { name: "Ăn uống", amount: 2800000, limit: 2500000, percentage: 33, trend: "up" },
    { name: "Di chuyển", amount: 1500000, limit: 1800000, percentage: 18, trend: "down" },
    { name: "Giải trí", amount: 1200000, limit: 1000000, percentage: 14, trend: "up" },
    { name: "Mua sắm", amount: 1000000, limit: 1200000, percentage: 12, trend: "stable" },
    { name: "Hóa đơn", amount: 800000, limit: 800000, percentage: 9, trend: "stable" },
    { name: "Khác", amount: 1200000, limit: 900000, percentage: 14, trend: "down" },
  ],

  // 💡 Đề xuất từ AI
  aiRecommendations: [
    {
      type: "warning",
      title: "Chi tiêu ăn uống tăng cao",
      description:
        "Tháng này bạn chi cho ăn uống nhiều hơn 15% so với tháng trước. Hãy cân nhắc nấu ăn tại nhà nhiều hơn.",
      action: "Giảm 500k/tháng",
    },
    {
      type: "success",
      title: "Tiến độ tiết kiệm tốt",
      description: "Bạn đang tiết kiệm đúng kế hoạch cho mục tiêu du lịch Nhật Bản.",
      action: "Tiếp tục duy trì",
    },
    {
      type: "info",
      title: "Cơ hội tăng thu nhập",
      description: "Dựa trên xu hướng, bạn có thể tăng thu nhập thêm 2M/tháng từ freelance.",
      action: "Xem chi tiết",
    },
  ],

  // 📊 Kế hoạch chi tiêu lý tưởng từ AI (dựa theo mục tiêu Du lịch Nhật Bản)
  recommendedBudget: [
    { name: "Ăn uống", amount: 2025000 },     // 30%
    { name: "Di chuyển", amount: 675000 },    // 10%
    { name: "Giải trí", amount: 675000 },     // 10%
    { name: "Mua sắm", amount: 1012500 },     // 15%
    { name: "Hóa đơn", amount: 1350000 },     // 20%
    { name: "Khác", amount: 1012500 },        // 15%
  ],
}
