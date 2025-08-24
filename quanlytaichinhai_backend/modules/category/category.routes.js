import express from "express";
import { confirmCategory, getCategoryIdByName } from "./category.controller.js";

const router = express.Router();

router.post("/", confirmCategory);
router.get("/check", getCategoryIdByName); // Thêm route cho /category/check
export default router;