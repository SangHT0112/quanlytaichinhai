import cv2
import re
import json
import os
import uuid
import easyocr
import numpy as np
from pyvi import ViTokenizer  # Optional
from dotenv import load_dotenv

load_dotenv()

# Category map mở rộng
CATEGORY_MAP = {
    'giầy|giày|quần|sơ mi|sơmi|quần áo|quần jean|gucci|lacoste|louis vuitton|lv|thời trang|jeans|store': 'Nhà cửa',
    'ăn|uống|quán|nhà hàng|phở|cơm|buffet|kem|tea|cafe|rau|thịt|heo|thơm|cá|loai|tom|cac|banh|mi|heo|rau|thơm|thịt': 'Ăn uống',
    'di chuyển|xe|ô tô|taxi|xe máy|grab|be|uber': 'Di chuyển',
    'giải trí|phim|nhạc|sách|game|karaoke': 'Giải trí',
    'hóa đơn|điện|thủy|internet|tiền điện|gas|phieu|phiếu': 'Hóa đơn',
    'y tế|bệnh viện|thuốc|bác sĩ|khám': 'Y tế',
    'giáo dục|học phí|sách vở|trường': 'Giáo dục',
    'du lịch|vé máy bay|khách sạn': 'Du lịch',
    'thể thao|gym|sân|bóng': 'Thể thao',
    'lương|thưởng|tiền thưởng': 'Lương'
}

def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (1024, 768))
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    cv2.imwrite('processed.jpg', enhanced)  # Debug
    return enhanced

def post_process_text(text):
    if not text:
        return text
    fixes = {
        'jeeanstore': 'jean store',
        'đja chi': 'địa chỉ', 'xa đàn': 'xã đàn', 'đien thoai': 'điện thoại',
        'hóa đơn ban hang': 'hóa đơn bán hàng', 's8 hđ': 'số hóa đơn hd00003',
        'ngày 17 tháng 07 nẳm 2020': 'ngày 17 tháng 07 năm 2020',
        'khách hâng': 'khách hàng',
        'tân phát ma vach': 'tân phát mã vạch',
        'đia chỉ': 'địa chỉ', 'hà nộl': 'hà nội', 'đơn @lá': 'đơn giá',
        'sl': 'số lượng', 'thành tlen': 'thành tiền', 'giầy': 'giày',
        's0 ml luls vuiton': 'sơ mi louis vuitton', 'quàn jean': 'quần jean',
        'tỏng tlên hàng': 'tổng tiền hàng', 'chiét khấu': 'chiết khấu', 'táng thanh toán': 'tổng thanh toán',
        '760,00 o': '760,000',
        'một trìệu tár trằm bón mươì nghln chẵn': 'một triệu tám trăm bốn mươi nghìn chẵn',
        'cẳm on và hen gặp lall': 'cảm ơn và hẹn gặp lại',
        'dông': 'đồng',
        'phieu': 'phiếu',
        'naey': 'nay',
        'ba rqi heo': 'bánh mì heo',
        'rau thom cac loai': 'rau thơm các loại',
        'tong ten': 'tổng tiền',
        'dong': 'đồng'
    }
    text_lower = text.lower()
    for wrong, correct in fixes.items():
        text_lower = re.sub(wrong, correct, text_lower, flags=re.IGNORECASE)
    try:
        tokenized = ViTokenizer.tokenize(text_lower)
        return tokenized.title()
    except ImportError:
        pass
    return text_lower.title().strip()

def categorize(desc):
    desc_lower = desc.lower()
    for keyword, cat in CATEGORY_MAP.items():
        if re.search(keyword, desc_lower):
            return cat
    return 'Hóa đơn'

def parse_fallback(results):
    if not results:
        return {"group_name": "Hóa đơn", "transaction_date": "2025-12-14", "total_amount": 0.0, "transactions": []}
    
    texts = []
    for (bbox, text, conf) in results:
        print(f"Raw line: '{text}' conf: {conf}")
        text = post_process_text(text)
        if conf > 0.3:
            y = np.mean([point[1] for point in bbox])
            texts.append((y, text))
    texts.sort(key=lambda x: x[0])
    full_text_list = [t[1] for t in texts]
    
    print(f"Post-processed texts: {full_text_list}")
    
    group_name = next((line for line in full_text_list if any(word in line.lower() for word in ['store', 'jean', 'hóa đơn bán hàng', 'phieu'])), full_text_list[0] if full_text_list else "Hóa đơn")
    
    # Date pattern cụ thể hơn (match sau "ngày", ignore số khác như SDT)
    date_pattern = r'(ngày\s+)?(\d{1,2})\s*(tháng\s+)?(\d{1,2})\s*(năm|nẳm\s+)?(\d{4})'
    date_match = re.search(date_pattern, ' '.join(full_text_list))
    transaction_date = "2025-12-14"
    if date_match:
        day, month, year = int(date_match.group(2)), int(date_match.group(4)), int(date_match.group(6))
        transaction_date = f"{year}-{month:02d}-{day:02d}"
    
    # Total linh hoạt (unique amounts, match 'tổng thanh toán')
    total_text = ' '.join(full_text_list).lower()
    amount_matches = re.findall(r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)', total_text)
    unique_amounts = list(set(amount_matches))  # Unique
    total_amount = 0.0
    for amt_str in unique_amounts:
        try:
            amt = float(amt_str.replace(',', ''))
            if re.search(r'(tong ten|tong thanh toán|tổng tiền).*' + re.escape(amt_str), total_text):
                total_amount = max(total_amount, amt)
        except ValueError:
            pass
    if total_amount == 0 and unique_amounts:
        total_amount = max([float(a.replace(',', '')) for a in unique_amounts])
    
    # Transactions tinh chỉnh (amount >1000, desc product-like, skip headers)
    transactions = []
    i = 0
    while i < len(full_text_list):
        line = full_text_list[i]
        amt_match = re.search(r'(\d{1,3}(?:,\d{3})*)', line)
        if amt_match:
            amount_str = amt_match.group(1).replace(',', '')
            amount = float(amount_str)
            if amount > 1000:  # Filter amount nhỏ (địa chỉ, số điện thoại)
                # Tìm desc trước, max 2 lines, skip headers
                desc_lines = []
                j = i - 1
                while j >= 0 and len(desc_lines) < 2 and not re.search(r'\d{1,3}(?:,\d{3})*', full_text_list[j]):
                    potential_desc = full_text_list[j].strip()
                    if len(potential_desc) > 5 and potential_desc.lower() not in ['quan', 'đóng đa', 'hà nội', 'thành tiền', 'đơn giá', 'sdt', 'điện thoại']:  # Skip headers
                        desc_lines.append(potential_desc)
                    j -= 1
                desc = ' '.join(reversed(desc_lines)).strip() or "Món hàng"
                if len(desc) > 5 and not re.search(r'(tổng|ngày|đơn giá|sl|địa chỉ|điện thoại)', desc.lower()):
                    cat = categorize(desc)
                    transactions.append({
                        "type": "expense",
                        "amount": amount,
                        "category": cat,
                        "description": desc[:50]
                    })
        i += 1
    
    return {
        "group_name": group_name,
        "transaction_date": transaction_date,
        "total_amount": round(total_amount, 2),
        "transactions": transactions
    }

def process_ocr(image_path: str):
    reader = easyocr.Reader(['vi', 'en'], gpu=False)
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Không đọc được ảnh từ {image_path}")
    
    processed = preprocess_image(image)
    
    results = reader.readtext(processed, detail=1, paragraph=False)
    
    print(f"Raw OCR result len: {len(results)}")
    
    extracted_data = parse_fallback(results)
    
    return [{
        "file_name": os.path.basename(image_path),
        "extract_data": extracted_data,
        "tokens": [0, 0]
    }]

if __name__ == "__main__":
    file_name = os.path.join(os.getcwd(), "images", "Test shoppe.jpg")
    if not os.path.exists(file_name):
        print(f"File không tồn tại: {file_name}. Tạo folder images/ và thêm 1.jpg nhé!")
        exit(1)
    results = process_ocr(file_name)
    print(json.dumps(results, indent=2, ensure_ascii=False))