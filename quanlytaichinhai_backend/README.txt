run env  .\env\Scripts\Activate.ps1

Cài fastapi và uvicorn
    pip install fastapi uvicorn
        python -c "import fastapi; print('FastAPI installed:', fastapi.__version__)"
        python -c "import uvicorn; print('Uvicorn installed:', uvicorn.__version__)"

Cài python-multipart
    pip install python-multipart
        python -c "import multipart; print('python-multipart installed')"

Cài paddleocr (phiên bản CPU)
    pip install paddleocr paddlepaddle
        python -c "from paddleocr import PaddleOCR; print('PaddleOCR installed')"

Cài transformers và torch (phiên bản CPU)
    pip install transformers torch
        python -c "import transformers; print('Transformers installed:', transformers.__version__)"
        python -c "import torch; print('PyTorch installed:', torch.__version__)"

    pip install opencv-python
    npm install formidable
    pip install pytesseract

chay FastAPI
uvicorn modules.ocr.document_processor:app --host 0.0.0.0 --port 8000

chay lai
uvicorn modules.ocr.document_process:app --reload

test_ocr.py
    python modules/ocr/test_ocr.py








PADDLE + YOLO + Lable Studio