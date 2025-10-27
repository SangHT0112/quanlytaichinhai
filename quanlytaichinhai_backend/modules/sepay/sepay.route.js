// routes/sepay.route.js
import express from "express";
import { handleSepayWebhook } from "../controllers/sepay.controller.js";
const router = express.Router();

router.post("/webhook", handleSepayWebhook);

export default router;
