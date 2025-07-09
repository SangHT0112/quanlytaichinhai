export const getCategoryIdByName = async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Thiếu tên danh mục" });

  const [rows] = await db.execute(
    'SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name.trim()]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: "Không tìm thấy danh mục" });
  }

  res.json({ category_id: rows[0].category_id });
};
