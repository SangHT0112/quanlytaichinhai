// lib/api/auth.ts
import axiosInstance from "@/config/axios";
import { AxiosError } from "axios";

// Định nghĩa cấu trúc của response lỗi từ server
interface ApiErrorResponse {
  message?: string; // message là tùy chọn, phòng trường hợp server không trả về
}

// Định nghĩa cấu trúc của response đăng nhập thành công
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    [key: string]: unknown; // Cho phép các thuộc tính khác của user
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axiosInstance.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    return response.data; // Trả về token và user
  } catch (error) {
    // Ép kiểu error thành AxiosError với dữ liệu lỗi là ApiErrorResponse
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Kiểm tra xem có response và message từ server không
    if (axiosError.response && axiosError.response.data?.message) {
      throw new Error(axiosError.response.data.message);
    } else {
      throw new Error("Không thể kết nối tới server");
    }
  }
}