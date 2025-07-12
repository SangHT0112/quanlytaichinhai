import express from "express"
import { saveHistory, getHistory, deleteHistory, getRecentHistory } from "./chat_history.controller.js"

const router = express.Router()

router.post("/", saveHistory);
router.get("/", getHistory);
router.delete("/", deleteHistory);
router.get("/recent", getRecentHistory);
export default router
