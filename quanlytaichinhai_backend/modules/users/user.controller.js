import { getAllUsers, updateUserRole } from "./user.model.js";

// Lấy danh sách tất cả người dùng
export async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách users:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
}

// Cập nhật quyền người dùng
export async function changeUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }

  try {
    await updateUserRole(id, role);
    res.json({ message: "Cập nhật quyền thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật quyền" });
  }
}
