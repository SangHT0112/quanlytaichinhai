import axiosInstance from "@/config/axios";

// Lấy toàn bộ users
export async function fetchUsers() {
  const res = await axiosInstance.get("/users");
  return res.data;
}

// Nếu muốn có phân trang
export async function fetchUsersPaginated(page: number, limit: number) {
  const res = await axiosInstance.get("/users", {
    params: { page, limit },
  });
  return res.data;
}

export async function updateUserRole(userId: number, role:string){
    const res = await  axiosInstance.put(`/users/${userId}/role`, {role});
    return res.data;
}