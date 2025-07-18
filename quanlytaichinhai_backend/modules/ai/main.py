from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from PIL import Image, UnidentifiedImageError
import shutil
import os
import uuid
from transformers import pipeline
import pytesseract

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr = PaddleOCR(use_angle_cls=True, lang='vi')

@app.post("/processDocument")
async def process_document(file: UploadFile = File(...)):
    try:
        # Kiểm tra định dạng ảnh
        try:
            image = Image.open(file.file)
            image.verify()
            file.file.seek(0)
        except UnidentifiedImageError:
            raise HTTPException(status_code=400, detail="File tải lên không phải là ảnh hợp lệ.")

        # Lưu file ảnh tạm
        upload_dir = "public/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_ext = os.path.splitext(file.filename)[-1].lower()
        saved_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(upload_dir, saved_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Gọi OCR
        result = ocr.ocr(file_path)
        # In kết quả thô để kiểm tra
        print("Kết quả thô từ OCR:")
        print(result)
                # Gọi OCR

        # Lấy dữ liệu từ dict
        rec_texts = result[0].get("rec_texts", [])
        rec_scores = result[0].get("rec_scores", [])

        return {
            "filename": saved_filename,
            "rec_texts": rec_texts,
            "rec_scores": rec_scores
        }

    except Exception as e:
        return {"error": f"Lỗi OCR: {str(e)}"}



