import { getFinancialSummary, fetchTopExpenseCategories, fetchExpensePieChart } from "./overview.model.js";
export async function getOverview(req, res){
    try{
        const {user_id} = req.query;
        if(!user_id) {
            return res.status(400).json({message: "Thiếu thông tin user_id"});
        }

        const data = await getFinancialSummary(user_id);
        res.json(data);
    }catch(err) {
        console.error("Lỗi lấy thông tin overview:", err);
        res.status(500).json({message: "Lỗi server", error: err.message});
    }
}

export async function getTopExpenseCategories(req, res) {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ message: "Thiếu thông tin user_id" });
        }

        const categories = await fetchTopExpenseCategories(user_id);
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