from openai import OpenAI

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "them_giao_dich",
        "descriptions": "Nguoi dung them giao dich vao, bao gom so tien, danh muc, loai giao dich",
        "parameter":{
            "type": "object",
            "properties": {
                "amount": {
                    "type": "number",
                    "description": "So tien cua giao dich"
                },
                "category": {
                    "type": "string",
                    "description": "Loai danh muc cua giao dich"
                },
                "type" : {
                    "type": "string",
                    "enum": ["expense", "income"],
                    "description": "Loai giao dich neu chi tieu thi [expense], thu nhap thi [income]",
                },
                "date" : {
                    "type": "string",
                    "description": "Ngay giao dich",
                }
            },
            "required": ["amount", "category", "type"],
            "additionalProperties": False
        },
        "strict": True
    }
}]

completion = client.chat.completions.create(
    model = "GPT-3.0",
    message = [
        {"role":"user", "content":"Hom nay toi mua ca phe het 20 nghin"}
    ],
    tools = tools
)
print(completion.choices[0].message.tool_calls)