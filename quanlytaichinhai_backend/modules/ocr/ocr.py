import sys
from PIL import Image
import pytesseract
import os
import io
import cv2
import numpy as np

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    # Đọc ảnh bằng OpenCV
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image could not be loaded")

    # Chuyển sang ảnh xám
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Tăng tương phản và loại nhiễu bằng adaptive threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15, 10
    )

    return Image.fromarray(thresh)

def main():
    if len(sys.argv) < 2:
        print("Error: Missing image path", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print("Error: Image file not found", file=sys.stderr)
        sys.exit(1)

    try:
        # Xử lý ảnh trước OCR
        preprocessed_image = preprocess_image(image_path)

        # In ra kết quả Unicode an toàn
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

        # Nhận diện văn bản
        text = pytesseract.image_to_string(preprocessed_image, lang='vie+eng')
        print(text)

    except Exception as e:
        print(f"OCR Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
