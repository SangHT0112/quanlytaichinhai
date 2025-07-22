from transformers import pipeline
from PIL import Image
import pytesseract

# Thay đường dẫn bên dưới bằng đường dẫn thật tới tesseract.exe
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Sử dụng mô hình đã huấn luyện sẵn cho task document QA
layoutlm = pipeline("document-question-answering", model="impira/layoutlm-document-qa")

image = Image.open("modules/ocr/images/bachhoaxanh.jpg")
question = "Tổng tiền là bao nhiêu?"

result = layoutlm(image=image, question=question)
print(result)
