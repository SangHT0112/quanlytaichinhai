"use client";
import { useEffect, useState } from "react";
import { fetchUsers, updateUserRole } from "@/apiAdmin/userApi";
import toast from "react-hot-toast";
import { useUser } from "@/contexts/UserProvider";
import type { User } from "@/types/users";

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]); // ✅ dùng User[] thay vì any[]
  const [loading, setLoading] = useState(true);

  const currentUser = useUser(); // ✅ lấy user đang đăng nhập nếu cần

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data: User[] = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Lỗi khi lấy users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeRole(userId: number, newRole: User["role"]) {
    try {
      await updateUserRole(userId, newRole);
      toast.success("Cập nhật quyền thành công");
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error("Lỗi khi đổi quyền:", err);
      toast.error("Cập nhật quyền thất bại");
    }
  }

  function renderStatus(user: User) {
    if (user.status === "online") {
      return <span className="text-green-500 font-medium">Đang hoạt động</span>;
    }
    if (user.last_active_at) {
      const diffMins = Math.floor(
        (Date.now() - new Date(user.last_active_at).getTime()) / 60000
      );
      if (diffMins <= 10) {
        return <span className="text-yellow-500">Hoạt động {diffMins} phút trước</span>;
      }
    }
    return <span className="text-gray-400">Ngoại tuyến</span>;
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Danh sách người dùng</h1>
      {currentUser && currentUser.role === "admin" && (
        <p className="mb-2 text-sm text-gray-600">
          Bạn đang đăng nhập với quyền <strong>{currentUser.role}</strong>
        </p>
      )}
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Tên</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Vai trò</th>
            <th className="border px-4 py-2">Trạng thái</th>
            <th className="border px-4 py-2">Phân quyền</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td className="border px-4 py-2">{user.user_id}</td>
              <td className="border px-4 py-2">{user.username}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.role}</td>
              <td className="border px-4 py-2">{renderStatus(user)}</td>
              <td className="border px-4 py-2">
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleChangeRole(user.user_id, e.target.value as User["role"])
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
