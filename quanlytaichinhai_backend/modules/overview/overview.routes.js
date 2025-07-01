import express from 'express';
import { getOverview, 
    getTopExpenseCategories, 
    getExpensePieChart,
    getWeeklyExpenses
 } from './overview.controller.js';

const router = express.Router();
router.get('/', getOverview)
router.get("/expense-top-categories", getTopExpenseCategories) 
router.get("/expense-pie-chart", getExpensePieChart)
router.get("/weekly-expenses", getWeeklyExpenses)
export default router;  