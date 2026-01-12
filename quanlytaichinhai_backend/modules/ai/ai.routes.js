import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { handleChat, confirmTransaction, confirmPriority, handleConfirmDelete,  processDocument } from './ai.controller.js'

const router = express.Router()

// Cấu hình multer để lưu file vào /public/uploads/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'public/uploads'
    fs.mkdirSync(uploadPath, { recursive: true }) // Tạo thư mục nếu chưa có
    cb(null, uploadPath)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, filename)
  },
})

const upload = multer({ storage })

router.post('/chat', handleChat)
router.post('/confirm', confirmTransaction)
router.post('/confirm-priority', confirmPriority)
router.post('/confirm_delete', handleConfirmDelete)
router.post('/process-document', upload.single('image'), processDocument)

export default router

