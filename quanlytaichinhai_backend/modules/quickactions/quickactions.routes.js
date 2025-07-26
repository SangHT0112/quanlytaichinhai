// routes/quickactions.routes.js
import express from "express";
import { getQuickActions } from "./quickactions.controller.js";

const router = express.Router();

// GET /api/quickactions?user_id=1
router.get("/", getQuickActions);

export default router;
