import db from "../../config/db.js"

export const getCategory = async (user_id) => {
  try {
    const [rows] = await db.execute(
      `SELECT * 
       FROM categories 
       WHERE user_id = ? OR user_id IS NULL
       AND name NOT IN ('Thu nhập khác', 'Chi tiêu khác')`,
      [user_id]
    );
    return rows;
  } catch (error) {
    console.error("Error in getCategory:", error);
    throw error;
  }
};


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


export class Category {
  static async create({ name, type, icon, user_id }) {
    try {
      const [result] = await db.execute(
        `INSERT INTO categories (name, type, icon, user_id, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [name, type, icon, user_id]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  static async findByName(name, user_id) {
    try {
      const [rows] = await db.execute(
        `SELECT category_id FROM categories 
         WHERE LOWER(name) = LOWER(?) AND user_id = ? LIMIT 1`,
        [name.trim(), user_id]
      );
      return rows.length > 0 ? rows[0].category_id : null;
    } catch (error) {
      console.error("Error finding category by name:", error);
      throw error;
    }
  }
}

export default Category;