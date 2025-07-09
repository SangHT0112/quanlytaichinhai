import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { parseReceipt } from './receipt.utils.js';
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRController {
  static async processReceipt(imagePath) {
    try {
      const pythonScriptPath = path.join(__dirname, 'ocr.py');
      const pythonPath = `"C:\\Users\\HTS SinhVienIT\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"`;
      const command = `${pythonPath} "${pythonScriptPath}" "${imagePath}"`;

      const { stdout } = await execAsync(command);
      const rawText = stdout.trim();

      const parsed = parseReceipt(rawText); // ✅ phân tích dữ liệu

      return parsed;

    } catch (error) {
      console.error('OCR Error (stderr):', error.stderr || error.message);
      throw new Error('OCR processing failed');
    }
  }
}



export default OCRController;
