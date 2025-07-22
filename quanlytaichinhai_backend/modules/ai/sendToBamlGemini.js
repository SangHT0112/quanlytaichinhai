import axios from "axios"
import FormData from "form-data"
import fs from "fs"

export async function sendToBamlGemini(imagePath) {
  const form = new FormData()
  form.append("file", fs.createReadStream(imagePath)) // dùng 'file' như FastAPI yêu cầu

  const response = await axios.post("http://localhost:8000/processDocument", form, {
    headers: form.getHeaders(),
  })
  console.log("Response from BAML Gemini:", response.data)
  return response.data?.result?.[0]?.extract_data || {}
}
