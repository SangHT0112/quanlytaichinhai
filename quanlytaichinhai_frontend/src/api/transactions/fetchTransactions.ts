import axiosInstance from "@/config/axios"

export async function fetchTransactions(userId: number, params?: { dateFilter?: string; limit?: number }) {
  const res = await axiosInstance.get("/transactions/groups", {
    params: {
      user_id: userId,
      date: params?.dateFilter,
      limit: params?.limit,
    },
  })
  return res.data
}

