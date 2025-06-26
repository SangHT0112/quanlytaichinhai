// lib/api/auth.ts
import axiosInstance from "@/config/axios"


export async function login(email: string, password: string) {
  try {
    const response = await axiosInstance.post(`/auth/login`, {
      email,
      password,
    })

    return response.data // chứa token và user
  } catch (error: any) {
    // Bắt lỗi từ server (có thể chứa response)
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message)
    } else {
      throw new Error("Không thể kết nối tới server")
    }
  }
}
