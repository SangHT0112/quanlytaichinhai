import express from 'express'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
import bodyParser from 'body-parser'

dotenv.config()
const app = express()
const port = 4000

app.use(bodyParser.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Bước 1 + 2: Nhận câu hỏi người dùng → AI quyết định gọi hàm
app.post('/api/ai/chat', async (req, res) => {
  const userMessage = req.body.message || "Tôi tiêu 100k ăn sáng hôm nay"

  // Định nghĩa "function"
  const tools = [
    {
      type: 'function',
      function: {
        name: 'ghi_giao_dich',
        description: 'Ghi nhận giao dịch tài chính người dùng đã chi tiêu',
        parameters: {
          type: 'object',
          properties: {
            so_tien: { type: 'number', description: 'Số tiền chi' },
            danh_muc: { type: 'string', description: 'Loại chi tiêu' },
            ngay: { type: 'string', description: 'Ngày' },
          },
          required: ['so_tien', 'danh_muc'],
        },
      },
    },
  ]

  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4.0',
    messages: [
      { role: 'system', content: 'Bạn là trợ lý tài chính cá nhân.' },
      { role: 'user', content: userMessage },
    ],
    tools,
    tool_choice: 'auto',
  })

  const toolCall = chatCompletion.choices[0].message.tool_calls?.[0]

  if (toolCall) {
    // 🧱 Bước 3: Thực hiện gọi hàm thật
    const args = JSON.parse(toolCall.function.arguments)

    // Đây là nơi bạn có thể ghi DB. Ở đây chỉ log ra.
    console.log("📥 Ghi giao dịch:", args)

    // Gửi kết quả gọi hàm về lại cho GPT (step 3 → 4)
    const secondResponse = await openai.chat.completions.create({
      model: 'gpt-4.0',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý tài chính cá nhân.' },
        { role: 'user', content: userMessage },
        {
          role: 'assistant',
          tool_calls: [toolCall],
        },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Đã ghi nhận ${args.so_tien} cho ${args.danh_muc} vào ngày ${args.ngay || 'hôm nay'}`,
        },
      ],
    })

    // ✅ Bước 4: GPT phản hồi lại user
    res.json({ reply: secondResponse.choices[0].message.content })
  } else {
    // Trường hợp GPT không gọi tool
    res.json({ reply: chatCompletion.choices[0].message.content })
  }
})

app.listen(port, () => {
  console.log(`🚀 Server chạy tại http://localhost:${port}`)
})


{onConfirm && (
                  <div className="flex justify-end pt-2">
                    <button
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      onClick={() => onConfirm(message)}
                    >
                      ✅ Xác nhận giao dịch
                    </button>
                  </div>
                )}