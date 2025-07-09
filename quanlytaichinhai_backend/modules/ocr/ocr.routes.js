import express from 'express';
import OCRController from './ocr.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

const router = express.Router();

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file uploaded' 
      });
    }

    const imagePath = req.file.path;
    const extractedText = await OCRController.processReceipt(imagePath);

    // Xoá file tạm sau khi xử lý thành công
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Lỗi khi xoá file tạm sau xử lý:', err);
    }

    return res.json({
      success: true,
      text: extractedText
    });

  } catch (error) {
    // Xoá file tạm nếu có lỗi trong xử lý OCR
    try {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch (err) {
      console.error('Lỗi khi xoá file tạm sau lỗi:', err);
    }

    console.error('OCR Processing Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'OCR processing failed'
    });
  }
});

export default router;
