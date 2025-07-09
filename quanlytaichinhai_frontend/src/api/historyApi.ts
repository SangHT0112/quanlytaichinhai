import axiosInstance from "@/config/axios";

export async function fetchHistoryTransactions(userId: number){
    const res = await axiosInstance.get("/transactions", {
        params: {user_id:userId},
    });
    return res.data;
}


// Hàm mới cho trang tổng quan
export async function fetchRecentTransactions(userId: number, limit = 5) {
  const res = await axiosInstance.get("/transactions", {
    params: { 
      user_id: userId,
      limit: limit
    }
  });
  return res.data;
}