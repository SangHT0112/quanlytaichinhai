import { Router } from 'express';
import {
  getTransactionHistory,
  createTransaction,
  createTransactionGroupWithItems,
  getGroupTransactionHistory,
  getGroupTransactionDetail
} from "./transaction.controller.js";
const router = Router();

router.get('/', getTransactionHistory);
router.post('/', createTransaction);
router.post("/groups", createTransactionGroupWithItems);
router.get("/groups", getGroupTransactionHistory);
router.get("/groups/:groupId", getGroupTransactionDetail);
export default router;