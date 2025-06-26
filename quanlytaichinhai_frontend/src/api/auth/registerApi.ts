import axiosInstance from "@/config/axios";

export async function register(username: string, email: string, password: string) {
    try{
        const res = await axiosInstance.post("/auth/register",{username, email, password})
        return res.data; // Trả về dữ liệu từ server
    }catch(error){
        throw error;
    }
}