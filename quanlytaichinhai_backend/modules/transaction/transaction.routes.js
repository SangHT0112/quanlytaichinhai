import { Router } from 'express';
import { 
  getTransactionHistory,
  createTransaction 
} from './transaction.controller.js';

const router = Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Giao dịch]
 *     summary: Lấy lịch sử giao dịch
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 */
router.get('/', getTransactionHistory);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Giao dịch]
 *     summary: Tạo giao dịch mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, amount, type, category_id, description, transaction_date]
 *             properties:
 *               user_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               category_id:
 *                 type: integer
 *               purpose_id:
 *                 type: integer
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               transaction_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Giao dịch được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction_id:
 *                   type: integer
 */
router.post('/', createTransaction);

export default router;