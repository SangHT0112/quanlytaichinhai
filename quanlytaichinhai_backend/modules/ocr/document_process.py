from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from transformers import LayoutLMv3Processor, LayoutLMv3ForQuestionAnswering
from PIL import Image
import pytesseract
import torch
from pathlib import Path

# Khởi tạo FastAPI và cấu hình CORS
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Có thể giới hạn theo domain nếu cần
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cấu hình đường dẫn tới tesseract.exe
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Khởi tạo OCR và model LayoutLMv3
ocr = PaddleOCR(use_angle_cls=True, lang="vi")
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base", apply_ocr=False)
model = LayoutLMv3ForQuestionAnswering.from_pretrained("microsoft/layoutlmv3-base")


@app.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    message: str = Form(""),
    user_id: str = Form("")
):
    try:
        # Lưu ảnh tạm vào thư mục uploads
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # OCR: trích xuất từ ảnh
        ocr_result = ocr.ocr(str(file_path))
        words = []
        boxes = []

        for line in ocr_result[0]:
            if len(line) >= 2:
                box_info = line[0]
                text_info = line[1]
                if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                    text = str(text_info[0])
                    words.append(text)
                    box = box_info[0] + box_info[2]  # 2 điểm: top-left + bottom-right
                    boxes.append([int(coord) for coord in box])

        # Nếu không có dữ liệu OCR, trả lỗi
        if not words or not boxes:
            return {"error": "Không nhận diện được văn bản trong ảnh."}

        # Mở ảnh
        image = Image.open(file_path).convert("RGB")

        # Chuẩn bị input cho LayoutLMv3
        encoding = processor(
            images=image,
            text="Tổng tiền là bao nhiêu?",
            words=[words],
            boxes=[boxes],
            return_tensors="pt"
        )

        # Dự đoán với model
        outputs = model(**encoding)
        start_logits = outputs.start_logits
        end_logits = outputs.end_logits

        # Trích xuất câu trả lời
        start_index = torch.argmax(start_logits, dim=1).item()
        end_index = torch.argmax(end_logits, dim=1).item() + 1
        tokens = encoding["input_ids"][0][start_index:end_index]
        answer = processor.tokenizer.decode(tokens, skip_special_tokens=True)

        # Dữ liệu có cấu trúc trả về
        structured_data = {
            "Tổng tiền": answer,
            "Ngày": "",              # Có thể dùng thêm câu hỏi phụ
            "Nhà cung cấp": ""
        }

        return {
            "raw": message or "Đã xử lý tài liệu",
            "imageUrl": f"/uploads/{file.filename}",
            "structured": structured_data,
            "intent": "document",
            "user_id": user_id
        }

    except Exception as e:
        return {"error": str(e)}
