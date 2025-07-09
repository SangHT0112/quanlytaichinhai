// Cach chay tool: "node tools/export-feedback-to-jsonl.js"

import fs from 'fs'
import path from 'path'
import db from '../config/db.js'

// Tạo thư mục exports nếu chưa có
const exportDir = path.resolve('exports')
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir)
}

const outputFile = path.join(exportDir, 'feedback-data.jsonl')

async function exportFeedback() {
  try {
    const [rows] = await db.query(`
      SELECT user_input, user_corrected, ai_suggested, confirmed
      FROM ai_feedback_logs
      WHERE confirmed = TRUE OR user_corrected IS NOT NULL
    `)

    const lines = []

    for (const row of rows) {
      const input = row.user_input
      const outputObj = row.user_corrected || row.ai_suggested

      if (!input || !outputObj) continue

      const jsonlEntry = {
        messages: [
          { role: "user", content: input },
          { role: "assistant", content: JSON.stringify(outputObj) }
        ]
      }

      lines.push(JSON.stringify(jsonlEntry))
    }

    fs.writeFileSync(outputFile, lines.join('\n'), 'utf8')
    console.log(`✅ Đã xuất ${lines.length} mẫu vào ${outputFile}`)
  } catch (error) {
    console.error("❌ Lỗi khi xuất dữ liệu:", error)
  } finally {
    db.end()
  }
}

exportFeedback()
