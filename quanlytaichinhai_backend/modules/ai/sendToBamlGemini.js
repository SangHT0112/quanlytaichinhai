import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config() // Load biến môi trường từ .env

export async function sendToBamlGemini(imagePath) {
  const form = new FormData()
  form.append("file", fs.createReadStream(imagePath))

  const response = await axios.post(process.env.PYTHON_API_URL, form, {
    headers: form.getHeaders(),
  })
  console.log("Response from BAML Gemini:", response.data)
  return response.data?.result?.[0]?.extract_data || {}
}
