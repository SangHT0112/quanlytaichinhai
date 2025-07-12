import db from '../../config/db.js';

//Load dữ liệu tổng quát về số dư, lương/ chi tiêu tháng này
export async function fetchFinancialSummary(userId) {
  // 1. Tính số dư thực tế
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

  // 3. Query cải tiến (thêm so sánh chi tiêu)
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

  // 4. Xử lý dữ liệu
  const income = parseFloat(summaryRows[0].current_income);
  const prevIncome = parseFloat(summaryRows[0].previous_income);
  const expense = parseFloat(summaryRows[0].current_expense);
  const prevExpense = parseFloat(summaryRows[0].previous_expense);

  // 5. Tính % thay đổi
  const calculateChange = (current, previous) => {
    if (current === 0 && previous === 0) return 0;
    if (previous === 0) return current > 0 ? 100 : -100; // Trả về giá trị hợp lý thay vì Infinity
    if (current === 0) return -100;
    return ((current - previous) / previous * 100);
  };

  // 6. Trả về kết quả
  return {
    actual_balance: actualBalance,
    current_income: income,
    previous_income: prevIncome,
    income_change_percentage: parseFloat(calculateChange(income, prevIncome).toFixed(1)),
    current_expense: expense,
    previous_expense: prevExpense,
    expense_change_percentage: parseFloat(calculateChange(expense, prevExpense).toFixed(1)),
    monthly_surplus: income - expense,
    last_updated: new Date().toISOString(),
    warnings: [
      ...(income === 0 && expense === 0 ? ["Chưa có giao dịch nào trong tháng này"] : []),
      ...(prevIncome === 0 && prevExpense === 0 ? ["Không có dữ liệu tháng trước để so sánh"] : [])
    ]
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






