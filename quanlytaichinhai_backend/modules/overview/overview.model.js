import db from '../../config/db.js';

//Load dữ liệu tổng quát về số dư, lương/ chi tiêu tháng này
export async function fetchFinancialSummary(userId) {
  // 1. Tính số dư thực tế (tổng thu - chi từ tất cả giao dịch)
  const [balanceRows] = await db.query(
    `SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
     FROM transactions WHERE user_id = ?`,
    [userId]
  );
  const actualBalance = parseFloat(balanceRows[0]?.balance || 0);

  // 2. Lấy ngày chính xác
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // 3. Query cho current và previous month (giữ nguyên)
  const [summaryRows] = await db.query(`
     SELECT 
      /* Income */
      COALESCE(SUM(CASE 
        WHEN type = 'income' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
        THEN amount ELSE 0 END), 0) as current_income,
      
      COALESCE(SUM(CASE 
        WHEN type = 'income' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
        THEN amount ELSE 0 END), 0) as previous_income,
      
      /* Expenses */
      COALESCE(SUM(CASE 
        WHEN type = 'expense' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
        THEN amount ELSE 0 END), 0) as current_expense,
        
      COALESCE(SUM(CASE 
        WHEN type = 'expense' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
        THEN amount ELSE 0 END), 0) as previous_expense
    FROM transactions 
    WHERE user_id = ? AND transaction_date IS NOT NULL`,
    [
      currentMonth, currentYear,
      prevMonth, prevYear,
      currentMonth, currentYear,
      prevMonth, prevYear,
      userId
    ]
  );

  // 4. Query mới: Thu nhập và chi tiêu trung bình 6 tháng gần nhất
  let averageIncome = 0;
  let averageExpense = 0;
  let incomeVolatility = 0;
  let expenseVolatility = 0;
  try {
    const [historyRows] = await db.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN monthly_amount ELSE 0 END) / GREATEST(COUNT(DISTINCT CASE WHEN type = 'income' THEN month END), 1) as avg_income,
        SUM(CASE WHEN type = 'expense' THEN monthly_amount ELSE 0 END) / GREATEST(COUNT(DISTINCT CASE WHEN type = 'expense' THEN month END), 1) as avg_expense,
        MAX(CASE WHEN type = 'income' THEN monthly_amount END) as max_income,
        MIN(CASE WHEN type = 'income' THEN monthly_amount END) as min_income,
        MAX(CASE WHEN type = 'expense' THEN monthly_amount END) as max_expense,
        MIN(CASE WHEN type = 'expense' THEN monthly_amount END) as min_expense,
        COUNT(DISTINCT CASE WHEN type = 'income' THEN month END) as income_months,
        COUNT(DISTINCT CASE WHEN type = 'expense' THEN month END) as expense_months
      FROM (
        SELECT 
          type,
          DATE_FORMAT(transaction_date, '%Y-%m') as month,
          SUM(amount) as monthly_amount
        FROM transactions 
        WHERE user_id = ? AND type IN ('income', 'expense') 
          AND transaction_date >= DATE_SUB(?, INTERVAL 6 MONTH)
          AND transaction_date IS NOT NULL
        GROUP BY type, DATE_FORMAT(transaction_date, '%Y-%m')
      ) as monthly_summary
    `, [userId, now]);

    const row = historyRows[0];
    if (row.income_months > 0) {
      averageIncome = parseFloat(row.avg_income || 0);
      const maxInc = parseFloat(row.max_income || 0);
      const minInc = parseFloat(row.min_income || 0);
      if (averageIncome > 0) {
        incomeVolatility = parseFloat((((maxInc - minInc) / averageIncome) * 100).toFixed(1));
      }
    }
    if (row.expense_months > 0) {
      averageExpense = parseFloat(row.avg_expense || 0);
      const maxExp = parseFloat(row.max_expense || 0);
      const minExp = parseFloat(row.min_expense || 0);
      if (averageExpense > 0) {
        expenseVolatility = parseFloat((((maxExp - minExp) / averageExpense) * 100).toFixed(1));
      }
    }
  } catch (error) {
    console.error('Lỗi khi tính lịch sử trung bình 6 tháng:', error);
    // Fallback: dùng current làm average nếu lỗi
    averageIncome = parseFloat(summaryRows[0].current_income);
    averageExpense = parseFloat(summaryRows[0].current_expense);
  }

  // 5. Xử lý dữ liệu current/previous
  const income = parseFloat(summaryRows[0].current_income);
  const prevIncome = parseFloat(summaryRows[0].previous_income);
  const expense = parseFloat(summaryRows[0].current_expense);
  const prevExpense = parseFloat(summaryRows[0].previous_expense);

  // 6. Tính % thay đổi (giữ nguyên)
  const calculateChange = (current, previous) => {
    if (current === 0 && previous === 0) return 0;
    if (previous === 0) return current > 0 ? 100 : -100;
    if (current === 0) return -100;
    return ((current - previous) / previous * 100);
  };

  // 7. Tính surplus trung bình (dùng average để robust hơn)
  const averageMonthlySurplus = averageIncome - averageExpense;

  // 8. Warnings mở rộng (thêm về volatility)
  const warnings = [
    ...(income === 0 && expense === 0 ? ["Chưa có giao dịch nào trong tháng này"] : []),
    ...(prevIncome === 0 && prevExpense === 0 ? ["Không có dữ liệu tháng trước để so sánh"] : []),
    ...(incomeVolatility > 20 ? [`Thu nhập biến động cao (${incomeVolatility}%) - cần đa dạng hóa nguồn thu`] : []),
    ...(expenseVolatility > 20 ? [`Chi tiêu biến động cao (${expenseVolatility}%) - theo dõi chặt chẽ hơn`] : []),
    ...(averageMonthlySurplus < 0 ? ["Thặng dư trung bình âm - cần cắt giảm chi tiêu ngay"] : [])
  ];

  // 9. Trả về kết quả (thêm average và volatility)
  return {
    actual_balance: actualBalance,
    current_income: income,
    previous_income: prevIncome,
    income_change_percentage: parseFloat(calculateChange(income, prevIncome).toFixed(1)),
    current_expense: expense,
    previous_expense: prevExpense,
    expense_change_percentage: parseFloat(calculateChange(expense, prevExpense).toFixed(1)),
    monthly_surplus: income - expense, // Giữ current surplus
    average_income: averageIncome,
    average_expense: averageExpense,
    income_volatility: incomeVolatility,
    expense_volatility: expenseVolatility,
    average_monthly_surplus: averageMonthlySurplus,
    last_updated: new Date().toISOString(),
    warnings
  };
}
//Danh sách các danh mục chi tiêu cao nhất giả sử lấy 5 cái
// Danh sách các danh mục chi tiêu cao nhất
export async function fetchTopExpenseCategories(
  userId,
  options = {
    timeframe: 'current_month',
    startDate: null,
    endDate: null
  }
) {
  // Thiết lập mặc định
  const { 
    timeframe = 'current_month',
    startDate,
    endDate 
  } = options;

  // Xây dựng điều kiện WHERE
  let dateCondition = '';
  const params = [userId];
  
  switch (timeframe) {
    case 'current_month':
      dateCondition = `AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE())
                      AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE())`;
      break;
      
    case 'last_month':
      dateCondition = `AND MONTH(t.transaction_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                      AND YEAR(t.transaction_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`;
      break;
      
    case 'current_week':
      dateCondition = `AND YEARWEEK(t.transaction_date, 1) = YEARWEEK(CURRENT_DATE(), 1)`;
      break;
      
    case 'custom':
      if (!startDate || !endDate) {
        throw new Error('startDate và endDate là bắt buộc khi chọn timeframe custom');
      }
      dateCondition = `AND t.transaction_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
      break;
  }

  const query = `
    SELECT 
      c.icon, 
      c.name AS category_name, 
      SUM(t.amount) AS total,
      COUNT(t.transaction_id) AS transaction_count
    FROM transactions t
    JOIN categories c ON t.category_id = c.category_id
    WHERE t.user_id = ? 
      AND t.type = 'expense'
      ${dateCondition}
    GROUP BY t.category_id
    ORDER BY total DESC
    LIMIT 5
  `;

  const [rows] = await db.execute(query, params);
  
  return rows;
}



//load danh sách các danh mục để tạo biểu đò tròn
export async function fetchExpensePieChart(userId) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [rows] = await db.execute(
    `SELECT c.icon, c.name AS category_name, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? 
       AND t.type = 'expense'
       AND MONTH(t.transaction_date) = ?
       AND YEAR(t.transaction_date) = ?
     GROUP BY t.category_id`,
    [userId, currentMonth, currentYear]
  );
  

  
  return rows;
}

export async function fetchWeeklyExpenses(userId){
  const [rows] = await db.execute(
    `SELECT DAYOFWEEK(transaction_date) AS weekday,
    SUM(amount) AS total_spent
    FROM transactions
    WHERE user_id = ?
    AND type = 'expense'
    AND YEARWEEK(transaction_date, 1) = YEARWEEK(CURDATE(), 1)
    GROUP BY weekday
    ORDER BY weekday
    `, [userId]
  )

  const weekdayMap = {
    1: 'Chủ nhật',
    2: 'Thứ hai',
    3: 'Thứ ba',
    4: 'Thứ tư',
    5: 'Thứ năm',
    6: 'Thứ sáu',
    7: 'Thứ bảy'
  }

  const fullweek = [2, 3, 4, 5, 6, 7, 1].map((day)=>({
    day: weekdayMap[day],
    chi: 0
  }))

  rows.forEach(row => {
    const match = fullweek.find(item => item.day === weekdayMap[row.weekday]);
    if(match){
      match.chi = row.total_spent;
    }
  })

  return fullweek;
}






