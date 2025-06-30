import db from '../../config/db.js';

//Load dữ liệu tổng quát về số dư, lương/ chi tiêu tháng này
export async function fetchFinancialSummary(userId){

    const [incomeRows] = await db.query(
        `SELECT SUM(amount) as total FROM transactions where user_id = ? and  type = 'income'`, [userId]
    );

     const [expenseRows] = await db.query(
        `SELECT SUM(amount) AS total FROM transactions WHERE user_id = ? AND type = 'expense'`,
        [userId]
     );

     const income = incomeRows[0].total || 0;
     const expense = expenseRows[0].total || 0;
     const balance = income - expense;

     return {
         income,
         expense,
         balance
     }
 }
//Danh sách các danh mục chi tiêu cao nhất giả sử lấy 5 cái
export async function fetchTopExpenseCategories(userId) {
  const [rows] = await db.execute(
    `SELECT c.icon, c.name AS category_name, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.type = 'expense'
     GROUP BY t.category_id
     ORDER BY total DESC
     LIMIT 5`,
    [userId]
  )

  return rows // [{ category_name: 'Ăn uống', total: 1500000 }, ...]
}

//load danh sách các danh mục để tạo biểu đò tròn
export async function fetchExpensePieChart(userId){
  const [rows] = await db.execute(
    `SELECT c.icon, c.name AS category_name, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.type = 'expense'
     GROUP BY t.category_id`,
    [userId]
  )
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






