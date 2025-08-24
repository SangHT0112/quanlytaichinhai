export const generateCreateCategoryPrompt = async ({ user_input, user_id }) => {
  return `
Bạn là hệ thống quản lý tài chính AI.
Người dùng vừa nhập: "${user_input}"

Hãy phân tích xem người dùng muốn tạo một danh mục mới. 
Trả về JSON đúng định dạng sau:

{
  "create_category": true,  luôn để là true
  "name": "Tên danh mục",
  "type": "income" hoặc "expense"
  "icon": tìm icon phù hợp ví dụ Di chuyển->🚗
  "user_id": ${user_id ?? null}
}

Quy tắc:
- Chỉ trả về JSON hợp lệ, không thêm giải thích.
`;
};
