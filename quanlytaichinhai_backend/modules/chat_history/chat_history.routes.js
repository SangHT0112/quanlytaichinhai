import express from "express";
import { saveHistory, getHistory, getRecentHistory, getTodayHistory } from "./chat_history.controller.js";

const router = express.Router();

router.post("/", saveHistory);
router.get("/", getHistory);
// router.delete("/", deleteHistory);
router.get("/recent", getRecentHistory);
router.get("/today", getTodayHistory);

export default router;