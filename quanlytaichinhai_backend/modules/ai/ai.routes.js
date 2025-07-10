import express from 'express'
import { classifyMessage, handleChat, handleChartRequest } from './ai.controller.js'
import { confirmTransaction } from './ai.controller.js'
const router = express.Router()

router.post('/chat', classifyMessage)
router.post('/chat/transaction', handleChat)
router.post('/chat/component', handleChartRequest)
router.post("/confirm", confirmTransaction)
export default router
