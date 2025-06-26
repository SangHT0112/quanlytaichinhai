import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { message } = await req.json()

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Bạn là trợ lý tài chính. Hãy trả lời ngắn gọn (dưới 3 câu) bằng tiếng Việt.",
      },
      { role: "user", content: message },
    ],
  })

  return Response.json({ reply: completion.choices[0].message.content })
}
