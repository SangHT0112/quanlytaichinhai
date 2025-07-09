import db from "../../config/db.js"

export const getCategoryIdByName = async (name) => {
  const [rows] = await db.execute(
    'SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name.trim()]
  )

  return rows.length > 0 ? rows[0].category_id : null
}

export const getCategoryIdByKeyword = async (categoryName) => {
  if (!categoryName) return null;

  try {
    // Truy vấn tối ưu hóa cho cấu trúc bảng của bạn
    const [rows] = await db.execute(
      `SELECT category_id, name 
       FROM categories 
       WHERE name LIKE ? 
       ORDER BY name = ? DESC, LENGTH(name) ASC
       LIMIT 1`,
      [`%${categoryName}%`, categoryName]
    );

    // Nếu tìm thấy kết quả khớp chính xác hoặc gần đúng
    return rows[0]?.category_id || null;
    
  } catch (error) {
    console.error("Lỗi truy vấn category:", error);
    return null;
  }
};