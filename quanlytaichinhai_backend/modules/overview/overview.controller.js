import { fetchFinancialSummary, 
    fetchTopExpenseCategories, 
    fetchExpensePieChart,
    fetchWeeklyExpenses
} from "./overview.model.js";
export async function getOverview(req, res) {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ message: "Thiếu thông tin user_id" });
    }

    const data = await fetchFinancialSummary(user_id);
    res.json(data);
  } catch (err) {
    console.error("Lỗi lấy thông tin overview:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}

export async function getTopExpenseCategories(req, res) {
  try {
    const { user_id, timeframe = "current_month", startDate, endDate } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "Thiếu thông tin user_id" });
    }

    const categories = await fetchTopExpenseCategories(Number(user_id), {
      timeframe,
      startDate,
      endDate,
    });

    res.json(categories);
  } catch (err) {
    console.error("Lỗi lấy danh mục chi tiêu:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}


export async function getExpensePieChart(req, res) {
    try{
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ message: "Thiếu thông tin user_id" });
        }

        const pieChartData = await fetchExpensePieChart(user_id);
        res.json(pieChartData);
    }catch(err) {
        console.error("Lỗi lấy biểu đồ chi tiêu:", err);
        res.status(500).json({message: "Lỗi server", error: err.message});
    }
}

export async function getWeeklyExpenses(req, res){
    try{
        const {user_id} = req.query;
        if(!user_id) {
            return res.status(400).json({message: "Thiếu thông tin user_id"});
        }
        const weeklyExpenses = await fetchWeeklyExpenses(user_id);
        res.json(weeklyExpenses);
    }catch(err){
        console.error("Lỗi lấy chi tiêu hàng tuần:", err);
        res.status(500).json({message: "Lỗi server", error: err.message});
    }
}