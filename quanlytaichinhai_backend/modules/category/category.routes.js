import express from "express";
import { confirmCategory, getCategoryIdByName, getCategories } from "./category.controller.js";

const router = express.Router();
router.get("/", getCategories); // GET /api/categories?user_id=1 → Lấy danh sách
router.post("/", confirmCategory);
router.get("/check", getCategoryIdByName); // Thêm route cho /category/check
export default router;