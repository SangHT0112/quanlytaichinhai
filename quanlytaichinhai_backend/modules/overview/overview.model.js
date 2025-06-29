import db from '../../config/db.js';
export async function getFinancialSummary(userId){

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





