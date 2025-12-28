import base64
import json
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

VALID_CATEGORIES = [
    "Lương", "Ăn uống", "Di chuyển", "Giải trí", "Hóa đơn", "Mua Sắm",
    "Y tế", "Nhà cửa", "Giáo dục", "Du lịch", "Thể thao", "Thưởng"
]


def image_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def process_openai_ocr(image_path: str) -> dict:
    image_base64 = image_to_base64(image_path)

    prompt = f"""
Bạn là hệ thống OCR + phân tích hóa đơn.

👉 Trích xuất thông tin và **CHỈ trả về JSON hợp lệ**, không thêm chữ nào khác.

FORMAT BẮT BUỘC:
{{
  "group_name": string,
  "transaction_date": "yyyy-mm-dd",
  "total_amount": number,
  "transactions": [
    {{
      "type": "expense",
      "amount": number,
      "category": string,
      "description": string
    }}
  ]
}}

⚠️ category BẮT BUỘC thuộc danh sách:
{VALID_CATEGORIES}

Nếu không chắc → chọn giá trị gần đúng nhất.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]
    )

    content = response.choices[0].message.content.strip()

    # ⚠️ Phòng trường hợp model bọc ```json
    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    return json.loads(content)
