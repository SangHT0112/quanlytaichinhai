import axiosInstance from "@/config/axios";
import axios from "axios";

export async function fetchHistoryTransactions(userId: number){
    const res = await axiosInstance.get("/history", {
        params: {user_id:userId},
    });
    return res.data;
}