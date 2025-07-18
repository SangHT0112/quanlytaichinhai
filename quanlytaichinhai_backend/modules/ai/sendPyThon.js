// sendPython.js
import axios from "axios";
import FormData from "form-data"; // <-- đúng thư viện node

import fs from "fs";

export async function sendToPython(imagePath) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(imagePath)); // đúng kiểu stream

  try {
    const response = await axios.post("http://localhost:8000/processDocument", formData, {
      headers: formData.getHeaders(), // giờ mới dùng được
    });

    return response.data;
  } catch (error) {
    console.error("❌ Lỗi gửi ảnh đến Python:", error.message);
    throw error;
  }
}
