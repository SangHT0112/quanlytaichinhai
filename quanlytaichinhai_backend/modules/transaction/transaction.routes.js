import { Router } from 'express';
import {
  getTransactionHistory,
  createTransaction,
  createTransactionGroupWithItems,
  getGroupTransactionHistory,
  getGroupTransactionDetail,
  getRecentTransactions,
  getGroupedTransactionHistory
} from "./transaction.controller.js";
const router = Router();

router.get('/', getTransactionHistory);
router.post('/', createTransaction);
router.post("/groups", createTransactionGroupWithItems);
router.get("/groups", getGroupTransactionHistory);
router.get("/recent", getRecentTransactions);
router.get("/groups/:groupId", getGroupTransactionDetail);
router.get("/grouped", getGroupedTransactionHistory);
export default router;