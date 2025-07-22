from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from PIL import Image

config = Cfg.load_config_from_name('vgg_transformer')
config['device'] = 'cpu'  # hoặc 'cuda' nếu có GPU
# Không cần config['weights'], chỉ lấy config mặc định

detector = Predictor(config)

img = Image.open('images/bachhoaxanh.jpg')
print(detector.predict(img))
