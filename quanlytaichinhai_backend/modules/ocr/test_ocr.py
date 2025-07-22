from paddleocr import PaddleOCR
from PIL import Image

ocr = PaddleOCR(use_textline_orientation=True, lang="vi")

image_path = "public/uploads/1752723576594-916669584.png"

# Hiển thị ảnh

# Thử nhận diện
result = ocr.ocr(image_path)

if not result:
    print("❌ Không nhận diện được gì từ ảnh.")
else:
    # Xử lý kết quả
    texts = result[0].get("rec_texts", [])
    scores = result[0].get("rec_scores", [])

    for idx, (text, score) in enumerate(zip(texts, scores)):
        print(f"Dòng {idx+1}:")
        print("  Nội dung:", text)
        print("  Độ tin cậy:", score)
