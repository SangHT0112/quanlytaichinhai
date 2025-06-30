import express from "express"
import { getTransactionHistory } from "./transaction.controller.js"
const router = express.Router()

// GET /api/transactions/history?user_id=1
router.get("/", getTransactionHistory)

export default router