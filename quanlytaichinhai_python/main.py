from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
import shutil
import uuid
import os
import traceback
from dotenv import load_dotenv

load_dotenv()
from engine_openai import process_openai_ocr

app = FastAPI()

app.mount("/public", StaticFiles(directory="public"), name="public")

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
        # Validate image
        try:
            image = Image.open(file.file)
            image.verify()
            file.file.seek(0)
        except UnidentifiedImageError:
            raise HTTPException(status_code=400, detail="File không phải ảnh hợp lệ")

        # Save image
        upload_dir = "public/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        ext = os.path.splitext(file.filename)[-1]
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # OCR bằng OpenAI
        structured_data = process_openai_ocr(file_path)

        # ✅ Chuẩn hóa response giống BAML cũ
        return {
            "result": [
                {
                    "file_name": file.filename,
                    "extract_data": structured_data,
                    "tokens": [0, 0]  # nếu muốn giữ tokens giả lập BAML
                }
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ping")
def ping():
    return {"status": "ok"}
