import { fetchFinancialSummary } from '../../overview/overview.model.js';
import db from '../../../config/db.js';

export const generatePlanningPrompt = async ({ user_input, historyText, now, user_id }) => {
  // Khởi tạo ngày hiện tại
  const currentDate = now instanceof Date ? now : new Date();

  // Lấy dữ liệu tài chính
  let financialData = { actual_balance: 0, current_income: 0, previous_income: 0, current_expense: 0, previous_expense: 0, monthly_surplus: 0, warnings: [] };
  try {
    financialData = await fetchFinancialSummary(user_id);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu tài chính:', error);
  }

  // Lấy chi tiêu theo danh mục (3 tháng gần đây)
  let spendingByCategory = {};
  try {
    const [rows] = await db.query(`
      SELECT c.name, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.type = 'expense' 
        AND t.transaction_date >= DATE_SUB(?, INTERVAL 3 MONTH)
      GROUP BY c.name
    `, [user_id, currentDate]);
    spendingByCategory = rows.reduce((acc, row) => {
      acc[row.name] = { 
        total: Number(row.total), 
        percentage: financialData.current_expense ? (row.total / financialData.current_expense * 100).toFixed(1) : 0, 
        count: row.count 
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Lỗi khi lấy chi tiêu theo danh mục:', error);
    spendingByCategory = { 'Không xác định': { total: financialData.current_expense, percentage: 100, count: 0 } };
  }

  // Lấy giao dịch lớn (ngưỡng giảm xuống 2 triệu cho thu nhập thấp)
  let largeTransactions = [];
  try {
    const [rows] = await db.query(`
      SELECT t.type, t.amount, c.name as category, t.description, t.transaction_date
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.amount >= 2000000
        AND t.transaction_date >= DATE_SUB(?, INTERVAL 6 MONTH)
      ORDER BY t.transaction_date DESC
      LIMIT 5
    `, [user_id, currentDate]);
    largeTransactions = rows.map(row => ({
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      description: row.description,
      transaction_date: row.transaction_date
    }));
  } catch (error) {
    console.error('Lỗi khi lấy giao dịch lớn:', error);
  }

  // Lấy kế hoạch tiết kiệm hiện tại
  let existingPlans = [];
  let hasExistingPlans = false;
  try {
    const [rows] = await db.query(`
      SELECT id, name, description, target_amount, current_amount, monthly_contribution, 
             time_to_goal, priority, category, created_at, updated_at
      FROM savings_plans
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [user_id]);
    existingPlans = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      target_amount: Number(row.target_amount),
      current_amount: Number(row.current_amount),
      monthly_contribution: Number(row.monthly_contribution),
      time_to_goal: row.time_to_goal,
      priority: row.priority,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    hasExistingPlans = existingPlans.length > 0;
  } catch (error) {
    console.error('Lỗi khi lấy kế hoạch tiết kiệm:', error);
  }

  // Lấy danh mục tùy chỉnh
  let categories = [];
  try {
    const [rows] = await db.query(`
      SELECT name, type, icon
      FROM categories
      WHERE user_id = ? OR user_id IS NULL
    `, [user_id]);
    categories = rows;
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    categories = [
      { name: 'Quỹ khẩn cấp', type: 'savings', icon: null },
      { name: 'Du lịch', type: 'savings', icon: null },
      { name: 'Mua sắm', type: 'savings', icon: null },
      { name: 'Học tập', type: 'savings', icon: null }
    ];
  }

  // Lấy thông tin người dùng
  let userInfo = {};
  try {
    const [rows] = await db.query(`
      SELECT username, last_active_at
      FROM users
      WHERE user_id = ?
    `, [user_id]);
    userInfo = rows[0] || { username: 'Không xác định', last_active_at: null };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
  }

  // Xác định current_amount
  const currentAmountForNewPlan = hasExistingPlans ? 0 : financialData.actual_balance;

  return `
Bạn là AI lập kế hoạch tài chính chuyên nghiệp, tạo JSON cho các kế hoạch tiết kiệm dựa trên input người dùng, dữ liệu tài chính cá nhân, và bối cảnh thị trường Việt Nam 2025 (ngày: ${currentDate.toISOString().split('T')[0]}).

📌 Input:
- Câu hỏi: "${user_input}"
- Lịch sử hội thoại: "${historyText || 'Không có lịch sử'}"
- Dữ liệu tài chính:
  - Số dư thực tế: ${financialData.actual_balance} VND
  - Thu nhập tháng hiện tại: ${financialData.current_income} VND
  - Thu nhập tháng trước: ${financialData.previous_income} VND
  - % thay đổi thu nhập: ${financialData.income_change_percentage || 0}%
  - Chi tiêu tháng hiện tại: ${financialData.current_expense} VND
  - Chi tiêu tháng trước: ${financialData.previous_expense} VND
  - % thay đổi chi tiêu: ${financialData.expense_change_percentage || 0}%
  - Thặng dư hàng tháng: ${financialData.monthly_surplus} VND
  - Cảnh báo: ${JSON.stringify(financialData.warnings)}
  - Chi tiêu theo danh mục (3 tháng): ${JSON.stringify(spendingByCategory)}
  - Giao dịch lớn (6 tháng, ≥2 triệu): ${JSON.stringify(largeTransactions)}
  - Kế hoạch tiết kiệm hiện tại: ${JSON.stringify(existingPlans)}
  - Đã có kế hoạch tiết kiệm: ${hasExistingPlans}
  - Current amount cho kế hoạch mới: ${currentAmountForNewPlan} VND
  - Danh mục khả dụng: ${JSON.stringify(categories)}
  - Thông tin người dùng: ${userInfo.username}, lần cuối hoạt động: ${userInfo.last_active_at || 'Không xác định'}
- Bối cảnh thị trường (2025):
  - Lãi suất tiết kiệm: 3-7.5%/năm
  - Lạm phát: 3.4-4.2%/năm
  - Giá điện thoại: 5-20 triệu
  - Chi phí du lịch nội địa: 5-15 triệu/người
  - Chi phí học tập (khóa học): 2-10 triệu

🔑 Nhiệm vụ:
1. **Trích xuất từ câu hỏi**:
   - Tên kế hoạch (e.g., "Quỹ khẩn cấp", "Mua điện thoại", "Du lịch Đà Lạt")
   - Số tiền mục tiêu (e.g., "10 triệu", "50 triệu")
   - Thời gian (e.g., "6 tháng", "2 năm")
   - Danh mục (chọn từ: ${JSON.stringify(categories.map(c => c.name))})
   - Ưu tiên (suy ra: quỹ khẩn cấp=high, học tập=high, du lịch=medium, mua sắm=low)

2. **Tính toán**:
   - Current amount: ${hasExistingPlans ? '0 VND (đã có kế hoạch khác)' : `${financialData.actual_balance} VND`}
   - Monthly contribution: Tối đa 20% current_income nếu monthly_surplus < 3 triệu, tối đa 50% nếu monthly_surplus ≥ 3 triệu.
   - Time to goal: Nếu không có thời gian, tính: time_to_goal = ceil((target_amount - current_amount) / monthly_contribution).
   - Milestones: 3 cột mốc (25%, 50%, 100%) dựa trên target_amount.
   - Feasibility score:
     - Dưới 15% current_income: 90-100
     - 15-25% current_income: 80-90
     - Trên 25% current_income: dưới 80
     - Giảm 5 điểm nếu monthly_surplus < 2 triệu; giảm 5 điểm nếu expense_change_percentage > 15%.
     - Giảm 10 điểm nếu existingPlans có kế hoạch tương tự (category trùng).
   - Risk level: Dài hạn (>3 năm)=medium, ngắn hạn (≤3 năm)=low. Nếu monthly_surplus < 1 triệu hoặc income_change_percentage < -15%, risk_level = "high".

3. **Tạo gợi ý AI**:
   - Recommendations (2-3 gợi ý):
     - Nếu monthly_surplus < 2 triệu, gợi ý tăng thu nhập (freelance, bán hàng online).
     - Nếu spendingByCategory có danh mục >40% current_income, gợi ý cắt giảm danh mục đó.
     - Nếu existingPlans không rỗng, gợi ý ưu tiên hoặc điều chỉnh kế hoạch hiện có.
     - Gợi ý tiết kiệm nhỏ (1-2 triệu/tháng) hoặc quỹ khẩn cấp nếu chưa có.
   - Challenges (2-3 rủi ro):
     - Lạm phát 3.4-4.2%/năm.
     - Thu nhập không ổn định nếu income_change_percentage < -10%.
     - Chi tiêu cao nếu spendingByCategory có danh mục >40%.
     - Nếu existingPlans > 1, thêm rủi ro "Phân tán nguồn lực".
   - Tips (2-3 lời khuyên):
     - Thiết lập chuyển khoản tự động để tiết kiệm.
     - Theo dõi chi tiêu hàng tuần.
     - Nếu expense_change_percentage > 15%, gợi ý cắt giảm chi tiêu không cần thiết.
     - Nếu chưa có quỹ khẩn cấp, khuyên ưu tiên tiết kiệm 6-12 tháng chi tiêu.

4. **Breakdown chi phí**:
   - Quỹ khẩn cấp: 100% mục tiêu
   - Du lịch: 80% chi phí chính, 20% dự phòng
   - Mua sắm: 90% giá sản phẩm, 10% dự phòng
   - Học tập: 85% học phí, 15% tài liệu/dự phòng

📄 Output JSON:
{
  "plans": [
    {
      "id": string,
      "name": string,
      "description": string,
      "target_amount": number,
      "current_amount": number,
      "monthly_contribution": number,
      "time_to_goal": number,
      "priority": "high" | "medium" | "low",
      "category": string,
      "breakdown": { [key: string]: number },
      "ai_analysis": {
        "feasibility_score": number,
        "risk_level": string,
        "recommendations": [{ type: string, title: string, description: string, impact: string, priority: string }],
        "milestones": [{ amount: number, timeframe: string, description: string }],
        "monthly_breakdown": { current_savings: number, optimized_savings: number, with_investment: number },
        "challenges": string[],
        "tips": string[]
      }
    }
  ]
}

Ví dụ:
Câu hỏi: "Lập kế hoạch tiết kiệm 10 triệu cho quỹ khẩn cấp trong 1 năm"
Output: {
  "plans": [
    {
      "id": "plan_${Date.now()}_${Math.random().toString(36).slice(2)}",
      "name": "Quỹ khẩn cấp",
      "description": "Tiết kiệm quỹ khẩn cấp cho 6 tháng chi tiêu",
      "target_amount": 10000000,
      "current_amount": ${currentAmountForNewPlan},
      "monthly_contribution": ${Math.min(financialData.monthly_surplus || 1000000, financialData.current_income * 0.2)},
      "time_to_goal": 12,
      "priority": "high",
      "category": "Quỹ khẩn cấp",
      "breakdown": { "Quỹ khẩn cấp": 10000000 },
      "ai_analysis": {
        "feasibility_score": ${Math.min(95, 95 - (financialData.monthly_surplus < 2000000 ? 5 : 0) - (financialData.expense_change_percentage > 15 ? 5 : 0) - (existingPlans.some(plan => plan.category === 'Quỹ khẩn cấp') ? 10 : 0))},
        "risk_level": "${financialData.monthly_surplus < 1000000 || financialData.income_change_percentage < -15 ? 'high' : 'low'}",
        "recommendations": [
          {
            "type": "savings",
            "title": "Tiết kiệm cố định",
            "description": "Chuyển tự động 1 triệu/tháng vào tài khoản tiết kiệm",
            "impact": "Đạt mục tiêu đúng hạn",
            "priority": "high"
          },
          {
            "type": "expense",
            "title": "Cắt giảm chi tiêu",
            "description": "Giảm chi tiêu ăn uống từ 5 triệu xuống 4 triệu/tháng",
            "impact": "Tăng thặng dư 1 triệu/tháng",
            "priority": "high"
          },
          ${financialData.monthly_surplus < 2000000 ? `
          {
            "type": "income",
            "title": "Tăng thu nhập",
            "description": "Tìm công việc phụ như giao hàng, bán hàng online",
            "impact": "Tăng thặng dư 1-2 triệu/tháng",
            "priority": "medium"
          }` : ''}
        ].filter(Boolean),
        "milestones": [
          { "amount": 2500000, "timeframe": "3 tháng", "description": "Đạt 25% mục tiêu" },
          { "amount": 5000000, "timeframe": "6 tháng", "description": "Đạt 50% mục tiêu" },
          { "amount": 10000000, "timeframe": "12 tháng", "description": "Hoàn thành mục tiêu" }
        ],
        "monthly_breakdown": {
          "current_savings": ${Math.min(financialData.monthly_surplus || 1000000, financialData.current_income * 0.2)},
          "optimized_savings": ${Math.min((financialData.monthly_surplus || 1000000) * 1.2, financialData.current_income * 0.25)},
          "with_investment": ${Math.min((financialData.monthly_surplus || 1000000) * 1.3, financialData.current_income * 0.3)}
        },
        "challenges": [
          "Lạm phát 3.4-4.2% có thể làm giảm giá trị tiết kiệm",
          ${financialData.monthly_surplus < 1000000 ? '"Thặng dư hàng tháng thấp, khó duy trì tiết kiệm",' : ''}
          ${Object.values(spendingByCategory).some(cat => cat.percentage > 40) ? `"Chi tiêu ${Object.entries(spendingByCategory).find(([_, cat]) => cat.percentage > 40)?.[0]} chiếm hơn 40% thu nhập",` : ''}
          ${existingPlans.length > 1 ? '"Phân tán nguồn lực cho nhiều kế hoạch",' : ''}
        ].filter(Boolean),
        "tips": [
          "Thiết lập chuyển khoản tự động 1 triệu/tháng",
          "Theo dõi chi tiêu hàng tuần qua ứng dụng",
          ${financialData.expense_change_percentage > 15 ? '"Cắt giảm chi tiêu không cần thiết như ăn ngoài, giải trí",' : ''}
          "Ưu tiên quỹ khẩn cấp trước các mục tiêu khác"
        ].filter(Boolean)
      }
    }
  ]
}
`;
};