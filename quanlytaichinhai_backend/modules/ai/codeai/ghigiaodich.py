from openai import OpenAI

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "ghi_giao_dich",
        "description": "Ghi nhận một giao dịch tài chính từ câu nói của người dùng.",
        "parameters": {
            "type": "object",
            "properties": {
                "so_tien": {
                    "type": "number",
                    "description": "Số tiền của giao dịch, đơn vị VND hoặc tương đương."
                },
                "danh_muc": {
                    "type": "string",
                    "description": "Loại danh mục giao dịch, ví dụ: ăn uống, mua sắm, di chuyển..."
                },
                "ngay": {
                    "type": "string",
                    "description": "Thời gian giao dịch, ví dụ: hôm qua, 01/07/2024, tối nay..."
                },
                "mo_ta": {
                    "type": "string",
                    "description": "Mô tả chi tiết giao dịch nếu có."
                }
            },
            "required": ["so_tien", "danh_muc"],
            "additionalProperties": False
        },
        "strict": True
    }
}]

completion = client.chat.completions.create(
    model="gpt-4.1",
    messages=[{
        "role": "user",
        "content": "Tối qua tôi đi ăn lẩu hết 450.000 ở quán Gogi"
    }],
    tools=tools
)

print(completion.choices[0].message.tool_calls)




[
  {
    "id": "call_abc123",
    "type": "function",
    "function": {
      "name": "ghi_giao_dich",
      "arguments": "{\"so_tien\": 450000, \"danh_muc\": \"ăn uống\", \"ngay\": \"tối qua\", \"mo_ta\": \"đi ăn lẩu ở quán Gogi\"}"
    }
  }
]
