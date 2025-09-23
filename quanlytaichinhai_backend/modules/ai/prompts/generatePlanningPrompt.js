import { fetchFinancialSummary } from '../../overview/overview.model.js';
import db from '../../../config/db.js';

export const generatePlanningPrompt = async ({ user_input, historyText, now, user_id }) => {
  // Khởi tạo ngày hiện tại
  const currentDate = now instanceof Date ? now : new Date();

  // Lấy dữ liệu tài chính từ fetchFinancialSummary
  let financialData;
  try {
    financialData = await fetchFinancialSummary(user_id);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu tài chính:', error);
  }

  // Lấy chi tiêu theo danh mục từ transactions
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

  // Lấy giao dịch lớn
  let largeTransactions = [];
  try {
    const [rows] = await db.query(`
      SELECT t.type, t.amount, c.name as category, t.description, t.transaction_date
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.amount >= 10000000
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

  // Lấy nhóm giao dịch lớn
  let largeTransactionGroups = [];
  try {
    const [rows] = await db.query(`
      SELECT group_name, total_amount, transaction_date
      FROM transaction_groups
      WHERE user_id = ? AND total_amount >= 10000000
        AND transaction_date >= DATE_SUB(?, INTERVAL 6 MONTH)
      ORDER BY transaction_date DESC
      LIMIT 5
    `, [user_id, currentDate]);
    largeTransactionGroups = rows.map(row => ({
      group_name: row.group_name,
      total_amount: Number(row.total_amount),
      transaction_date: row.transaction_date
    }));
  } catch (error) {
    console.error('Lỗi khi lấy nhóm giao dịch:', error);
  }

  // Lấy các kế hoạch tiết kiệm hiện tại từ bảng savings_plans
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
      { name: 'Tiết kiệm', type: 'savings', icon: null },
      { name: 'Bất động sản', type: 'savings', icon: null },
      { name: 'Phương tiện', type: 'savings', icon: null },
      { name: 'Du lịch', type: 'savings', icon: null }
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
    userInfo = { username: 'Không xác định', last_active_at: null };
  }

  // Xác định current_amount dựa trên việc đã có kế hoạch hay chưa
  const currentAmountForNewPlan = hasExistingPlans ? 0 : financialData.actual_balance;

  return `
Bạn là AI lập kế hoạch tài chính chuyên nghiệp, tạo JSON cho các kế hoạch tiết kiệm dựa trên input người dùng, dữ liệu tài chính cá nhân, và dữ liệu thị trường Việt Nam 2025 (ngày hiện tại: ${currentDate.toISOString().split('T')[0]}).

📌 Input:
- Câu hỏi: "${user_input}"
- Lịch sử hội thoại: "${historyText || 'Không có lịch sử'}"
- Dữ liệu tài chính:
  - Số dư thực tế: ${financialData.actual_balance} VND
  - Thu nhập tháng hiện tại: ${financialData.current_income} VND
  - Thu nhập tháng trước: ${financialData.previous_income} VND
  - % thay đổi thu nhập: ${financialData.income_change_percentage}%
  - Chi tiêu tháng hiện tại: ${financialData.current_expense} VND
  - Chi tiêu tháng trước: ${financialData.previous_expense} VND
  - % thay đổi chi tiêu: ${financialData.expense_change_percentage}%
  - Thặng dư hàng tháng: ${financialData.monthly_surplus} VND
  - Cảnh báo: ${JSON.stringify(financialData.warnings)}
  - Chi tiêu theo danh mục (3 tháng gần đây): ${JSON.stringify(spendingByCategory)}
  - Giao dịch lớn (6 tháng, ≥10 triệu): ${JSON.stringify(largeTransactions)}
  - Nhóm giao dịch lớn (6 tháng, ≥10 triệu): ${JSON.stringify(largeTransactionGroups)}
  - Kế hoạch tiết kiệm hiện tại: ${JSON.stringify(existingPlans)}
  - Đã có kế hoạch tiết kiệm: ${hasExistingPlans}
  - Current amount cho kế hoạch mới: ${currentAmountForNewPlan} VND
  - Danh mục khả dụng: ${JSON.stringify(categories)}
  - Thông tin người dùng:
    - Tên người dùng: ${userInfo.username}
    - Lần cuối hoạt động: ${userInfo.last_active_at || 'Không xác định'}
- Dữ liệu thị trường (2025):
  - Giá BĐS quận 7: 50-65 triệu/m² (70m² ~3.5-4.5 tỷ)
  - Lãi suất tiết kiệm: 3-7.5%/năm
  - Lạm phát: 3.4-4.2%/năm

🔑 Nhiệm vụ:
1. Trích xuất từ câu hỏi:
   - Tên kế hoạch (e.g., "Mua căn hộ", "Du lịch Nhật Bản", "Mua xe hơi")
   - Số tiền mục tiêu (e.g., "3.5 tỷ", "50 triệu", "800 triệu")
   - Thời gian (e.g., "10 năm", "8 tháng", "5 năm")
   - Danh mục (chọn từ danh mục khả dụng: ${JSON.stringify(categories.map(c => c.name))})
   - Ưu tiên (suy ra: nhà=high, du lịch=medium, quỹ khẩn cấp=high, xe hơi=medium)
2. Tính toán:
   - Current amount: ${hasExistingPlans ? '0 VND (vì đã có kế hoạch khác)' : `${financialData.actual_balance} VND (kế hoạch đầu tiên)`}
   - Monthly contribution: Dựa trên thặng dư hàng tháng (monthly_surplus). Nếu có kế hoạch hiện tại, cần tính toán phân bổ hợp lý.
   - Time to goal: Nếu không có thời gian, tính: time_to_goal = ceil((target_amount - current_amount) / monthly_surplus).
   - Milestones: Chia mục tiêu thành 3-5 cột mốc (20%, 40%, 60%, 80%, 100%) dựa trên target_amount.
   - Feasibility score: Dựa trên tỷ lệ tổng monthly_contribution của tất cả kế hoạch / current_income:
     - Dưới 30% → 90-100
     - 30-50% → 80-90
     - Trên 50% → dưới 80
     - Giảm 5 điểm nếu income_change_percentage < -10%; giảm thêm 5 điểm nếu expense_change_percentage > 10%.
     - Giảm 10 điểm nếu existingPlans có kế hoạch tương tự (name hoặc category trùng).
   - Risk level: Dựa trên thời gian (dài hạn > 5 năm=medium, ngắn hạn ≤ 5 năm=low). Nếu income_change_percentage < -20%, tăng lên "high".
3. Tạo gợi ý AI:
   - Recommendations: 2-4 gợi ý (tăng tiết kiệm, đầu tư, thời điểm mua, phương án thay thế). 
     - Nếu income_change_percentage < 0, thêm gợi ý ổn định thu nhập.
     - Nếu spendingByCategory có danh mục chi tiêu cao (>30%), gợi ý cắt giảm danh mục đó.
     - Nếu existingPlans không rỗng, gợi ý điều chỉnh kế hoạch hiện có hoặc ưu tiên kế hoạch.
   - Challenges: 2-3 rủi ro (lạm phát, giá BĐS/xe tăng, thu nhập không ổn định). 
     - Bao gồm warnings nếu có.
     - Nếu largeTransactions hoặc largeTransactionGroups có chi tiêu lớn, thêm rủi ro "Chi tiêu bất thường".
     - Nếu existingPlans có nhiều kế hoạch, thêm rủi ro "Phân tán nguồn lực".
   - Tips: 2-4 lời khuyên (chuyển khoản tự động, theo dõi thị trường). 
     - Nếu expense_change_percentage > 10% hoặc spendingByCategory có danh mục chi cao, thêm lời khuyên cắt giảm chi tiêu.
     - Nếu existingPlans không rỗng, gợi ý ưu tiên kế hoạch quan trọng nhất hoặc điều chỉnh phân bổ.
4. Breakdown chi phí:
   - BĐS: 85% giá nhà, 5% phí, 5% nội thất, 5% dự phòng
   - Du lịch: 80% chi phí chính, 20% dự phòng
   - Quỹ khẩn cấp: 100% mục tiêu
   - Phương tiện: 85% giá xe, 5% phí, 5% bảo hiểm, 5% dự phòng

📄 Output JSON:
{ 
  "plans": [
    {
      "id": string,
      "name": string,
      "description": string,
      "target_amount": number,
      "current_amount": number, // = ${currentAmountForNewPlan}
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
Câu hỏi: "Lập kế hoạch tiết kiệm 800 triệu mua xe hơi trong 5 năm"
Output: {
  "plans": [
    {
      "id": "plan_${Date.now()}_${Math.random().toString(36).slice(2)}",
      "name": "Mua xe hơi",
      "description": "Xe sedan 5 chỗ, giá khoảng 800 triệu tại TP.HCM",
      "target_amount": 800000000,
      "current_amount": ${currentAmountForNewPlan},
      "monthly_contribution": ${Math.min(financialData.monthly_surplus || 4000000, 10000000)},
      "time_to_goal": 60,
      "priority": "medium",
      "category": "Phương tiện",
      "breakdown": {
        "Giá xe": 680000000,
        "Phí": 40000000,
        "Bảo hiểm": 40000000,
        "Dự phòng": 40000000
      },
      "ai_analysis": {
        "feasibility_score": ${Math.min(90, 90 - (financialData.income_change_percentage < -10 ? 5 : 0) - (financialData.expense_change_percentage > 10 ? 5 : 0) - (existingPlans.some(plan => plan.category === 'Phương tiện') ? 10 : 0))},
        "risk_level": "${financialData.income_change_percentage < -20 ? 'high' : 'low'}",
        "recommendations": [
          {
            "type": "optimization",
            "title": "Tăng tiết kiệm",
            "description": "Tăng lên 12 triệu/tháng để rút ngắn thời gian",
            "impact": "Tiết kiệm thời gian",
            "priority": "high"
          },
          {
            "type": "investment",
            "title": "Đầu tư quỹ trái phiếu",
            "description": "Đầu tư 20% vào quỹ trái phiếu 6%/năm",
            "impact": "Tăng tốc 15%",
            "priority": "medium"
          }
          ${financialData.income_change_percentage < 0 ? `,
          {
            "type": "income",
            "title": "Ổn định thu nhập",
            "description": "Tìm cách tăng thu nhập qua công việc phụ hoặc đầu tư nhỏ",
            "impact": "Giảm rủi ro tài chính",
            "priority": "high"
          }` : ''},
          ${Object.values(spendingByCategory).some(cat => cat.percentage > 30) ? `,
          {
            "type": "expense",
            "title": "Cắt giảm chi tiêu",
            "description": "Giảm chi tiêu ở danh mục ${Object.entries(spendingByCategory).find(([_, cat]) => cat.percentage > 30)?.[0] || 'cao nhất'}",
            "impact": "Tăng thặng dư hàng tháng",
            "priority": "high"
          }` : ''},
          ${existingPlans.length > 0 ? `,
          {
            "type": "adjustment",
            "title": "Điều chỉnh kế hoạch hiện có",
            "description": "Xem xét điều chỉnh phân bổ với kế hoạch ${existingPlans[0]?.name || 'hiện có'} để tối ưu hóa",
            "impact": "Tối ưu hóa thặng dư",
            "priority": "medium"
          }` : ''}
        ].filter(Boolean),
        "milestones": [
          {
            "amount": 400000000,
            "timeframe": "2 năm",
            "description": "Đạt 50% mục tiêu"
          },
          {
            "amount": 600000000,
            "timeframe": "3.5 năm",
            "description": "Đạt 75% mục tiêu"
          },
          {
            "amount": 800000000,
            "timeframe": "5 năm",
            "description": "Hoàn thành mục tiêu"
          }
        ],
        "monthly_breakdown": {
          "current_savings": ${Math.min(financialData.monthly_surplus || 4000000, 10000000)},
          "optimized_savings": ${Math.min((financialData.monthly_surplus || 4000000) * 1.2, 12000000)},
          "with_investment": ${Math.min((financialData.monthly_surplus || 4000000) * 1.3, 13000000)}
        },
        "challenges": [
          "Giá xe có thể tăng do lạm phát 3-4%/năm",
          "Cần duy trì thu nhập ổn định",
          ${financialData.income_change_percentage < -10 ? '"Thu nhập giảm đáng kể so với tháng trước",' : ''}
          ${largeTransactions.some(tx => tx.type === 'expense') || largeTransactionGroups.length > 0 ? '"Có chi tiêu lớn bất thường trong 6 tháng qua",' : ''}
          ${existingPlans.length > 0 ? '"Cần phân bổ nguồn lực cho nhiều kế hoạch tiết kiệm",' : ''}
          ${financialData.warnings.length > 0 ? JSON.stringify(financialData.warnings[0]) : ''}
        ].filter(Boolean).filter(item => item !== ''),
        "tips": [
          "So sánh giá từ các đại lý",
          "Ưu tiên mua xe vào cuối năm để được ưu đãi",
          "Giữ quỹ dự phòng riêng cho bảo dưỡng",
          ${financialData.expense_change_percentage > 10 ? '"Xem xét cắt giảm chi tiêu không cần thiết",' : ''}
          ${existingPlans.length > 0 ? '"Ưu tiên kế hoạch có độ ưu tiên cao nhất và điều chỉnh phân bổ hợp lý",' : ''}
          "Thiết lập chuyển khoản tự động để duy trì kỷ luật tiết kiệm"
        ].filter(Boolean).filter(item => item !== '')
      }
    }
  ]
}
`;
};