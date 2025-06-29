import express from 'express';
import { getOverview, getTopExpenseCategories, getExpensePieChart } from './overview.controller.js';

const router = express.Router();
router.get('/', getOverview)
router.get("/top-categories", getTopExpenseCategories) 
router.get("/expense-pie-chart", getExpensePieChart)
export default router;  