from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
import shutil
import uuid
import sys
import os
from dotenv import load_dotenv
load_dotenv()  # Load các biến từ file .env
# Thêm đường dẫn đến thư mục `baml` để import được engine.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'baml')))

from engine import process_baml


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

        # Gọi xử lý bằng BAML
        result = process_baml(file_path)
        print("✅ Kết quả từ BAML:", result)

        return {
            "filename": saved_filename,
            "result": result,
        }

    except Exception as e:
        return {"error": f"Lỗi xử lý: {str(e)}"}
