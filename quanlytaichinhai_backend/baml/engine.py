import base64
import cv2
from baml_py import ClientRegistry
from baml_client.sync_client import b
from baml_py import Image
import json
import os

import traceback, sys
from baml_py import Collector
import uuid
from dotenv import load_dotenv
load_dotenv()

API_KEYS = [
    os.getenv("GOOGLE_API_KEY_1"),
    os.getenv("GOOGLE_API_KEY_2"),
    os.getenv("GOOGLE_API_KEY_3"),
]
def create_custom_registry(api_key: str, LLM_CR="Gemini_2_0_pro"):
    cr = ClientRegistry()
    cr.set_primary(LLM_CR)
    # ép key vào client_registry
    cr.get_client(LLM_CR).api_key = api_key
    return cr


def init_cr(LLM_CR="Gemini_1_5_pro"):
    # Initialize baml client registry.
    cr = ClientRegistry()
    cr.set_primary(LLM_CR)
    return cr


def to_json(results):
    """Save extracted results to a JSON file inside a unique folder for each image."""

    def serialize(obj):
        if hasattr(obj, "dict"):
            return obj.dict()
        elif hasattr(obj, "__dict__"):
            return obj.__dict__
        else:
            return str(obj)
    return json.loads(json.dumps(results, indent=4, ensure_ascii=False, default=serialize))


def llm_extract_image(images_base64, client_registry):
    extraction_type = "EKYB"
    collector_llm_image = Collector(name="collector_llm_image")
    extract_functions = {"EKYB": b.ExtractInvoices}
    
    image_result = extract_functions[extraction_type](
        images_base64, {"client_registry": client_registry, "collector": collector_llm_image}
    )
    
    tokens = [collector_llm_image.usage.input_tokens, collector_llm_image.usage.output_tokens]
    return to_json(image_result), tokens


def image_to_base64(image):
    _, buffer = cv2.imencode('.png', image)  # Change to '.jpg' if needed
    base64_string = base64.b64encode(buffer).decode('utf-8')
    return Image.from_base64("image/png", base64_string)


def llm_predict_images(cr, images):
    images_base64 = [image_to_base64(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)) for image in images]
    llm_results, tokens = llm_extract_image(images_base64=images_base64, client_registry=cr)
    return llm_results, tokens


def llm_predict(uuid, files_name, cr, images=None):

    results, llm_results, tokens = [], None, [0, 0]
    try:
        llm_results, tokens = llm_predict_images(cr, images)

        results.append({
            "file_name": os.path.basename(files_name),
            "extract_data": llm_results,
            "tokens": tokens
        })
        
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        tb_info = traceback.extract_tb(exc_tb)
        print("ID {} >>> ERROR LLM inference, Message Error: {}, exc_type: {}, exc_obj: {}, \
                        exc_tb: {}, tb_info: {}". format(str(uuid), str(e), exc_type, exc_obj, exc_tb, tb_info))
        results.append({
            "file_name": os.path.basename(files_name),
            "extract_data": None,
            "tokens": tokens
        })
    return results

def process_baml(image_path: str):
    uid = uuid.uuid4()
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Không đọc được ảnh từ {image_path}")

    last_error = None
    for api_key in API_KEYS:
        try:
            print(f"[🧪] Đang dùng API Key: {api_key[:10]}...")
            cr = create_custom_registry(api_key=api_key)
            results = llm_predict(uuid=str(uid), files_name=image_path, images=[image], cr=cr)

            # Nếu kết quả hợp lệ thì trả về
            if results and results[0]["extract_data"] is not None:
                print(f"[✅] Thành công với key: {api_key[:10]}")
                return results

            # Nếu không có dữ liệu thì raise để thử key khác
            raise Exception("Không có extract_data.")
        except Exception as e:
            print(f"[❌] Lỗi với key {api_key[:10]}: {str(e)}")
            last_error = e

    # Nếu tất cả key đều lỗi
    raise Exception(f"Tất cả API key đều lỗi. Lỗi cuối cùng: {str(last_error)}")


if __name__ == "__main__":
    cr = init_cr(LLM_CR="Gemini_2_0_pro")
    uid = uuid.uuid1()
    file_name = "images/1.jpg"
    image = cv2.imread(file_name)
    
    results = process_baml(file_name)
    print("results >>> ", results)
    pass