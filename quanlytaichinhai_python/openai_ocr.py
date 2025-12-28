import base64
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def image_to_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def extract_invoice_from_image(image_path: str):
    image_b64 = image_to_base64(image_path)

    response = client.responses.create(
        model="gpt-4o-mini",
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "transaction",
                "schema": {
                    "type": "object",
                    "properties": {
                        "group_name": {"type": "string"},
                        "transaction_date": {"type": "string"},
                        "total_amount": {"type": "number"},
                        "transactions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string"},
                                    "amount": {"type": "number"},
                                    "category": {"type": "string"},
                                    "description": {"type": "string"}
                                },
                                "required": ["type","amount","category","description"]
                            }
                        }
                    },
                    "required": ["group_name","transaction_date","total_amount","transactions"]
                }
            }
        },
        input=[{
            "role": "user",
            "content": [
                {"type": "input_text", "text": "OCR hóa đơn và trích xuất dữ liệu"},
                {"type": "input_image", "image_base64": image_b64}
            ]
        }]
    )

    data = response.output_parsed


    text = response.output_text

    # cố parse JSON
    try:
        return json.loads(text)
    except:
        return {
            "raw_text": text
        }
