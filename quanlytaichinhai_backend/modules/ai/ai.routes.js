import express from 'express'
import { handleChat } from './ai.controller.js'
import { confirmTransaction } from './ai.controller.js'
const router = express.Router()

router.post('/chat', handleChat)
router.post("/confirm", confirmTransaction)
export default router
