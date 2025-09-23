// savings_plans.routes.js
import express from "express";
import { getPlans, savePlan, deletePlan } from "./savings_plans.controller.js";

const router = express.Router();

router.get("/", getPlans);
router.post("/", savePlan);
router.delete("/", deletePlan);
export default router;