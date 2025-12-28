import base64
from openai import OpenAI
import json
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def image_to_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def ocr_invoice(image_path):
    img_base64 = image_to_base64(image_path)

    response = client.responses.create(
        model="gpt-4o-mini",  # rẻ + có vision
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": """
Trích xuất thông tin từ hóa đơn và trả về JSON đúng schema sau:

{
  "group_name": string,
  "transaction_date": "yyyy-mm-dd",
  "total_amount": number,
  "transactions": [
    {
      "type": "expense",
      "amount": number,
      "category": string,
      "description": string
    }
  ]
}
Chỉ trả về JSON, không giải thích.
"""
                    },
                    {
                        "type": "input_image",
                        "image_base64": img_base64
                    }
                ]
            }
        ]
    )

    text = response.output_text
    return json.loads(text)
