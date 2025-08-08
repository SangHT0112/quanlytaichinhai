import express from "express";
import { getUsers, changeUserRole } from "./user.controller.js";

const router = express.Router();

// GET /api/users -> lấy danh sách user
router.get("/", getUsers);

// PUT /api/users/:id/role -> cập nhật quyền user
router.put("/:id/role", changeUserRole);

export default router;
