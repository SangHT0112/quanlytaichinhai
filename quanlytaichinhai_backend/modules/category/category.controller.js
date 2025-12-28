import Category from "./category.model.js";
import db from "../../config/db.js"
import { getCategory } from "./category.model.js";
export const getCategories = async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu user_id" });
    }

    // Gọi model để lấy categories (user-specific + global, loại trừ fallback)
    const data = await getCategory(Number(userId));
    res.json(data); // Trả array categories [{category_id, name, type, icon, ...}]
  } catch (err) {
    console.error("Lỗi getCategories:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh mục" });
  }
};
export const getCategoryIdByName = async (req, res) => {
  const { name, user_id } = req.query; // Thêm user_id
  if (!name || !user_id) {
    return res.status(400).json({ error: "Thiếu tên danh mục hoặc user_id" });
  }

  try {
    const [rows] = await db.execute(
      'SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?) AND user_id = ? LIMIT 1',
      [name.trim(), user_id]
    );

    return res.status(200).json({ exists: rows.length > 0 });
  } catch (error) {
    console.error("Error checking category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const confirmCategory = async (req, res) => {
  const { user_id, suggested_category, confirm, temporary_transaction } = req.body;

  if (!user_id || !suggested_category || confirm === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { name, type, icon, create_category } = suggested_category;

    // Kiểm tra nếu danh mục đã tồn tại cho user
    const existingCategoryId = await Category.findByName(name, user_id);
    if (existingCategoryId) {
      return res.status(409).json({ message: "Category already exists", category_id: existingCategoryId });
    }

    if (confirm) {

      // Nếu là fallback category -> KHÔNG tạo mới trong DB
      if (!create_category && (name === "Chi tiêu khác" || name === "Thu nhập khác")) {
        if (temporary_transaction) {
          const updatedTransactions = {
            ...temporary_transaction,
            transactions: temporary_transaction.transactions.map(tx => ({
              ...tx,
              category_id: null, // không có category_id trong DB
              category: name,
            })),
            user_id,
          };

          return res.status(200).json({
            message: "Fallback category applied, no new category created",
            structured: {
              response_type: "transaction",
              group_name: updatedTransactions.group_name || name,
              transaction_date: updatedTransactions.transaction_date || new Date().toISOString(),
              user_id,
              transactions: updatedTransactions.transactions.map(tx => ({
                type: tx.type || "expense",
                amount: Number(tx.amount) || 0,
                category: tx.category || name,
                user_id: tx.user_id || user_id,
                transaction_date: tx.transaction_date || new Date().toISOString(),
                description: tx.description || `Giao dịch với danh mục ${name}`,
              })),
            },
          });
        }

        return res.status(200).json({
          message: "Fallback category applied (no transaction linked)",
        });
      }
      // Thêm danh mục mới
      const categoryId = await Category.create({ name, type, icon, user_id });

      // Nếu là tạo trực tiếp (create_category: true) → chỉ tạo danh mục và trả về
      if (create_category) {
        return res.status(201).json({
          message: "Category created successfully",
          category_id: categoryId,
          structured: {
            response_type: "create_category",
            name,
            type,
            icon,
            user_id,
          }
        });
      }

      // Nếu có temporary_transaction → kiểm tra và trả về transaction form
      if (temporary_transaction) {
        // Kiểm tra xem transactions có tồn tại và là mảng không
        if (!temporary_transaction.transactions || !Array.isArray(temporary_transaction.transactions)) {
          return res.status(400).json({ error: "Invalid or missing transactions array in temporary_transaction" });
        }

        const updatedTransactions = {
          ...temporary_transaction,
          transactions: temporary_transaction.transactions.map(tx => ({
            ...tx,
            category_id: categoryId,
            category: name,
          })),
          user_id,
        };

        const transactionResponse = {
          response_type: "transaction",
          group_name: updatedTransactions.group_name || name,
          transaction_date: updatedTransactions.transaction_date || new Date().toISOString(),
          user_id,
          transactions: updatedTransactions.transactions.map(tx => ({
            type: tx.type || "expense",
            amount: Number(tx.amount) || 0,
            category: tx.category || name,
            user_id: tx.user_id || user_id,
            transaction_date: tx.transaction_date || updatedTransactions.transaction_date || new Date().toISOString(),
            description: tx.description || `Giao dịch với danh mục ${name}`,
          })),
        };

        return res.status(201).json({
          message: "Category created successfully, please confirm the transaction",
          category_id: categoryId,
          structured: transactionResponse,
        });
      }

      // Nếu không có temporary_transaction → chỉ trả về thông tin danh mục
      return res.status(201).json({
        message: "Category created successfully",
        category_id: categoryId,
      });
    } else {
      return res.status(200).json({ message: "Category creation skipped" });
    }
  } catch (error) {
    console.error("Error in confirmCategory:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

