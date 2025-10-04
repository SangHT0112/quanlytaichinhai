// savings_plans.routes.js
import express from "express";
import { getPlans, savePlan, deletePlan, updatePlansOnLoad } from "./savings_plans.controller.js";

const router = express.Router();

router.get("/", getPlans);
router.post("/", savePlan);
router.delete("/", deletePlan);
router.get('/update-on-load', updatePlansOnLoad);
export default router;