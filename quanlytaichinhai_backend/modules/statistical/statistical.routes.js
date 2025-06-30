import express from 'express'
import {
  expensePieChart,
  dailyTrend,
  monthlyIncomeExpense,
  topCategories,
  overview,
} from './statistical.controller.js'

const router = express.Router()

router.get('/expense-pie-chart', expensePieChart)
router.get('/daily-trend', dailyTrend)
router.get('/monthly-income-expense', monthlyIncomeExpense)
router.get('/top-categories', topCategories)
router.get('/', overview)

export default router

