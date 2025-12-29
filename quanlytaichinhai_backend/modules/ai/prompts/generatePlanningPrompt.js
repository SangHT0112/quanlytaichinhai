import { fetchFinancialSummary } from '../../overview/overview.model.js';
import db from '../../../config/db.js';

// Fallback prices cho các category (dùng làm hint min/max, không gán avg cứng - dựa trên data 12/2025)
const fallbacks = {
  electronics: { min: 5000000, max: 50000000 },
  travel: { min: 10000000, max: 50000000 },  // Update: Phù hợp quốc tế hơn
  vehicle: { min: 20000000, max: 50000000 },
  education: { min: 2000000, max: 100000000 },
  real_estate: { min: 1000000000, max: 5000000000 },
  wedding: { min: 50000000, max: 200000000 },
  emergency: { min: 30000000, max: 60000000 },
  general: { min: 10000000, max: 100000000 }
};

// Hàm detect goal từ user_input (không search, chỉ detect category/item và hint range)
const detectGoalAndFetchPrice = async (user_input) => {
  const lowerInput = user_input.toLowerCase();
  let detected = { item: null, category: null, estimated_price: null, price_range: null };

  // Regex patterns cho common goals
  const patterns = {
    electronics: /(iphone|ipad|samsung|macbook|laptop)/i,
    travel: /(du lịch|japan|nhật|đà lạt|phú quốc)/i,
    vehicle: /(xe máy|wave|exciter|xe hơi)/i,
    education: /(học|khóa học|đại học|thạc sĩ)/i,
    real_estate: /(mua nhà|đất|chung cư|nhà mặt tiền tphcm)/i,
    wedding: /(đám cưới|kết hôn)/i,
    emergency: /quỹ khẩn cấp/i
  };

  for (const [cat, regex] of Object.entries(patterns)) {
    if (regex.test(lowerInput)) {
      detected.category = cat;
      detected.item = lowerInput.match(regex)[0]; // Extract item name
      break;
    }
  }

  if (!detected.item) {
    detected.category = 'general';
    detected.item = 'mục tiêu chung';
  }

  // Chỉ dùng range làm hint, không gán estimated_price (để AI tự tính)
  detected.price_range = fallbacks[detected.category] || fallbacks.general;
  console.log(`🔍 Detected: "${detected.item}" (${detected.category}), hint range: ${detected.price_range.min.toLocaleString()}-${detected.price_range.max.toLocaleString()} VND`);

  return detected;
};

// Hàm fetch market data dynamic (chỉ general)
const fetchMarketData = async () => {
  try {
    // Có thể fetch từ API thật nếu cần (e.g., inflation từ NHNN VN)
    return {
      general: { 
        inflation: 3.8, // %/năm 12/2025
        savings_rate: { min: 3, max: 7.5 } // %/năm
      }
    };
  } catch (error) {
    console.error('Lỗi fetch market data:', error);
    return {
      general: { inflation: 4, savings_rate: { min: 3, max: 7.5 } }
    };
  }
};

export const generatePlanningPrompt = async ({ user_input, historyText, now, user_id }) => {
  // Khởi tạo ngày hiện tại
  const currentDate = now instanceof Date ? now : new Date();
  
  // Detect goal (không search giá, chỉ hint range)
  const detected = await detectGoalAndFetchPrice(user_input);
  
  // Fetch market data
  const marketData = await fetchMarketData();
  
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

  // Lấy giao dịch lớn (ngưỡng 2 triệu cho thu nhập thấp)
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

  // Xác định current_amount cho kế hoạch mới (với rebalance)
  let totalRemainingForExisting = 0;
  existingPlans.forEach(plan => {
    if (plan.current_amount < plan.target_amount) {
      totalRemainingForExisting += (plan.target_amount - plan.current_amount);
    }
  });

  // Số dư khả dụng cho plan mới (ưu tiên cover existing trước)
  const availableBalanceForNewPlan = Math.max(0, financialData.actual_balance - totalRemainingForExisting);

  // Cap conservative: Chỉ dùng 50% available cho plan mới, giữ 50% làm buffer
  const currentAmountForNewPlan = Math.min(availableBalanceForNewPlan * 0.5, (detected.estimated_price || financialData.actual_balance) * 0.5);

  // Thêm cảnh báo nếu existing cần nhiều tiền
  if (totalRemainingForExisting > 0 && availableBalanceForNewPlan < financialData.actual_balance) {
    financialData.warnings.push(`Ưu tiên hoàn thành existing plans: Còn thiếu ${totalRemainingForExisting.toLocaleString()} VND. Dư khả dụng cho plan mới: ${availableBalanceForNewPlan.toLocaleString()} VND`);
  }

  console.log(`💰 Rebalance: Total remaining existing: ${totalRemainingForExisting.toLocaleString()}, Available: ${availableBalanceForNewPlan.toLocaleString()}, Current for new: ${currentAmountForNewPlan.toLocaleString()}`);

  // Build market context động, dùng detected range làm hint
  const marketContext = `
    - Bối cảnh thị trường (12/2025):
      - Lãi suất tiết kiệm: ${marketData.general.savings_rate.min}-${marketData.general.savings_rate.max}%/năm
      - Lạm phát: ${marketData.general.inflation}%/năm
      - Hint range cho mục tiêu "${detected.item}" (${detected.category}): ${detected.price_range.min.toLocaleString()}-${detected.price_range.max.toLocaleString()} VND (dùng để validate target_amount bạn tính).
      - Chi phí du lịch nội địa: 5-15 triệu/người
      - Chi phí học tập (khóa học): 2-10 triệu
  `;

  // Tính toán một số giá trị cho ví dụ (giữ nguyên để ví dụ)
  const monthlyContribution = Math.min(financialData.monthly_surplus || 1000000, financialData.current_income * 0.2);
  const feasibilityScore = Math.min(95, 95 - (financialData.monthly_surplus < 2000000 ? 5 : 0) - (financialData.expense_change_percentage > 15 ? 5 : 0) - (existingPlans.some(plan => plan.category === 'Quỹ khẩn cấp') ? 10 : 0));
  const riskLevel = financialData.monthly_surplus < 1000000 || financialData.income_change_percentage < -15 ? 'high' : 'low';
  const highExpenseCategory = Object.entries(spendingByCategory).find(([_, cat]) => cat.percentage > 40)?.[0];
  const hasHighExpense = Object.values(spendingByCategory).some(cat => cat.percentage > 40);
  const hasMultiplePlans = existingPlans.length > 1;

  // Xây dựng recommendations động (giữ nguyên)
  let recommendations = [
    {
      type: "savings",
      title: "Tiết kiệm cố định",
      description: "Chuyển tự động 1 triệu/tháng vào tài khoản tiết kiệm",
      impact: "Đạt mục tiêu đúng hạn",
      priority: "high"
    },
    {
      type: "expense",
      title: "Cắt giảm chi tiêu",
      description: "Giảm chi tiêu ăn uống từ 5 triệu xuống 4 triệu/tháng",
      impact: "Tăng thặng dư 1 triệu/tháng",
      priority: "high"
    }
  ];
  if (financialData.monthly_surplus < 2000000) {
    recommendations.push({
      type: "income",
      title: "Tăng thu nhập",
      description: "Tìm công việc phụ như giao hàng, bán hàng online",
      impact: "Tăng thặng dư 1-2 triệu/tháng",
      priority: "medium"
    });
  }

  // Challenges động (giữ nguyên)
  let challenges = [
    "Lạm phát 3.4-4.2% có thể làm giảm giá trị tiết kiệm"
  ];
  if (financialData.monthly_surplus < 1000000) {
    challenges.push("Thặng dư hàng tháng thấp, khó duy trì tiết kiệm");
  }
  if (hasHighExpense) {
    challenges.push(`Chi tiêu ${highExpenseCategory} chiếm hơn 40% thu nhập`);
  }
  if (hasMultiplePlans) {
    challenges.push("Phân tán nguồn lực cho nhiều kế hoạch");
  }

  // Tips động (giữ nguyên)
  let tips = [
    "Thiết lập chuyển khoản tự động 1 triệu/tháng",
    "Theo dõi chi tiêu hàng tuần qua ứng dụng"
  ];
  if (financialData.expense_change_percentage > 15) {
    tips.push("Cắt giảm chi tiêu không cần thiết như ăn ngoài, giải trí");
  }
  tips.push("Ưu tiên quỹ khẩn cấp trước các mục tiêu khác");

  // Monthly breakdown (giữ nguyên)
  const optimizedSavings = Math.min((financialData.monthly_surplus || 1000000) * 1.2, financialData.current_income * 0.25);
  const withInvestment = Math.min((financialData.monthly_surplus || 1000000) * 1.3, financialData.current_income * 0.3);

  return `
Bạn là AI lập kế hoạch tài chính chuyên nghiệp, tạo JSON cho các kế hoạch tiết kiệm dựa trên input người dùng, dữ liệu tài chính cá nhân, và bối cảnh thị trường Việt Nam 2025 (ngày: ${currentDate.toISOString().split('T')[0]}).

📌 Input:
- Câu hỏi: "${user_input}"
- Lịch sử hội thoại: "${historyText || 'Không có lịch sử'}"
- Detected goal: "${JSON.stringify(detected)}" (dùng price_range làm hint để validate target_amount bạn tính; KHÔNG dùng làm default).
${marketContext}
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
  - Current amount cho kế hoạch mới: ${currentAmountForNewPlan.toLocaleString()} VND (sau rebalance existing: available ${availableBalanceForNewPlan.toLocaleString()} VND)
  - Danh mục khả dụng: ${JSON.stringify(categories)}
  - Thông tin người dùng: ${userInfo.username}, lần cuối hoạt động: ${userInfo.last_active_at || 'Không xác định'}

🔑 Nhiệm vụ:
1. **Trích xuất từ câu hỏi và tính target_amount phù hợp (step-by-step reasoning)**:
   - Tên kế hoạch (e.g., "Quỹ khẩn cấp", "Mua iPhone 17 Pro Max", "Du lịch Tokyo 10 ngày").
   - Thời gian (e.g., "6 tháng", "2 năm"; extract từ input như "trong 10 ngày").
   - Danh mục (chọn từ: ${JSON.stringify(categories.map(c => c.name))}).
   - Ưu tiên (suy ra: quỹ khẩn cấp=high, học tập=high, du lịch=medium, mua sắm=low).
   - **Tính target_amount ĐỘNG**:
     - Bước 1: Extract goal chi tiết từ user_input (e.g., sản phẩm: "iPhone 17 Pro Max 256GB", duration: "10 ngày").
     - Bước 2: Research giá base qua web_search (query động: "giá [extracted_goal] chính hãng Việt Nam tháng 12 2025 site:thegioididong.com OR site:fptshop.com.vn OR site:cellphones.com.vn OR site:didongviet.vn OR site:vietravel.com num_results=10"). Parse top 5 prices VND hợp lý (5-100tr, bỏ noise), tính base_price = avg hoặc max (an toàn).
     - Bước 3: Adjust phù hợp với user: target = base_price * (1 + 0.1 cho buffer lạm phát/phí) + adjust theo feasibility (nếu monthly_surplus < 2tr, giảm 10% target; nếu time ngắn <6 tháng, tăng contribution thay vì target; validate trong hint range).
     - Bước 4: Nếu user chỉ định số tiền (e.g., "30tr"), dùng nó làm target. Log reasoning: "Base price: X VND → Target phù hợp: Y VND (lý do: Z)".
     - Ví dụ: iPhone 17 Pro Max → base 37tr → target 40.7tr (buffer), nhưng surplus thấp → target 35tr (đạt trong 8 tháng).

2. **Tính toán khác**:
   - Current amount: ${currentAmountForNewPlan.toLocaleString()} VND (sau rebalance).
   - Monthly contribution: Tối đa 20% current_income nếu monthly_surplus < 3 triệu, tối đa 50% nếu ≥ 3 triệu; adjust theo target (e.g., contribution = (target - current) / time_to_goal).
   - Time to goal: Extract từ input, hoặc tính: Math.ceil((target_amount - current_amount) / monthly_contribution).
   - Milestones: 3 cột mốc (25%, 50%, 100%) dựa trên target_amount.
   - Feasibility score:
     - Dựa target/income: Dưới 15% current_income/năm: 90-100; 15-25%: 80-90; Trên 25%: dưới 80.
     - Giảm 5 điểm nếu monthly_surplus < 2 triệu; giảm 5 điểm nếu expense_change_percentage > 15%.
     - Giảm 10 điểm nếu existingPlans có kế hoạch tương tự (category trùng).
   - Risk level: Dài hạn (>3 năm)=medium, ngắn hạn (≤3 năm)=low. Nếu monthly_surplus < 1 triệu hoặc income_change_percentage < -15%, hoặc target > surplus * 12, risk_level = "high".

3. **Tạo gợi ý AI**:
   - Recommendations (2-3 gợi ý): Nếu monthly_surplus < 2 triệu, gợi ý tăng thu nhập (freelance, bán hàng online). Nếu spendingByCategory có danh mục >40% current_income, gợi ý cắt giảm danh mục đó. Nếu existingPlans không rỗng, gợi ý ưu tiên hoặc điều chỉnh kế hoạch hiện có. Gợi ý tiết kiệm nhỏ (1-2 triệu/tháng) hoặc quỹ khẩn cấp nếu chưa có. Gợi ý so sánh giá (e.g., mua iPhone chính hãng để tránh đội giá).
   - Challenges (2-3 rủi ro): Lạm phát 3.4-4.2%/năm. Thu nhập không ổn định nếu income_change_percentage < -10%. Chi tiêu cao nếu spendingByCategory có danh mục >40%. Nếu existingPlans > 1, thêm rủi ro "Phân tán nguồn lực".
   - Tips (2-3 lời khuyên): Thiết lập chuyển khoản tự động để tiết kiệm. Theo dõi chi tiêu hàng tuần. Nếu expense_change_percentage > 15%, gợi ý cắt giảm chi tiêu không cần thiết. Nếu chưa có quỹ khẩn cấp, khuyên ưu tiên tiết kiệm 6-12 tháng chi tiêu.

4. **Breakdown chi phí** (dùng price_range sau tính target nếu có):
   - Quỹ khẩn cấp: 100% mục tiêu
   - Du lịch: 50% vé máy bay (dùng min price_range), 25% lưu trú, 15% ăn uống, 10% di chuyển/dự phòng
   - Mua sắm: 95% giá sản phẩm (dùng target_amount * 0.95), 5% phụ kiện/dự phòng
   - Học tập: 85% học phí, 15% tài liệu/dự phòng
   - Nếu category khác, suy luận dựa trên detected (e.g., real_estate: 80% giá nhà, 20% phí pháp lý).

📄 Output JSON (KHÔNG bao gồm reasoning, chỉ JSON sạch):
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

Ví dụ (dùng target tính động):
Câu hỏi: "Lập kế hoạch tiết kiệm 10 triệu cho quỹ khẩn cấp trong 1 năm"
Output: {
  "plans": [
    {
      "id": "plan_${Date.now()}_${Math.random().toString(36).slice(2)}",
      "name": "Quỹ khẩn cấp",
      "description": "Tiết kiệm quỹ khẩn cấp cho 6 tháng chi tiêu",
      "target_amount": 10000000,  // Tính từ input, không gán
      "current_amount": ${currentAmountForNewPlan},
      "monthly_contribution": ${monthlyContribution},
      "time_to_goal": 12,
      "priority": "high",
      "category": "Quỹ khẩn cấp",
      "breakdown": { "Quỹ khẩn cấp": 10000000 },
      "ai_analysis": {
        "feasibility_score": ${feasibilityScore},
        "risk_level": "${riskLevel}",
        "recommendations": ${JSON.stringify(recommendations)},
        "milestones": [
          { "amount": 2500000, "timeframe": "3 tháng", "description": "Đạt 25% mục tiêu" },
          { "amount": 5000000, "timeframe": "6 tháng", "description": "Đạt 50% mục tiêu" },
          { "amount": 10000000, "timeframe": "12 tháng", "description": "Hoàn thành mục tiêu" }
        ],
        "monthly_breakdown": {
          "current_savings": ${monthlyContribution},
          "optimized_savings": ${optimizedSavings},
          "with_investment": ${withInvestment}
        },
        "challenges": ${JSON.stringify(challenges)},
        "tips": ${JSON.stringify(tips)}
      }
    }
  ]
}
`;
};