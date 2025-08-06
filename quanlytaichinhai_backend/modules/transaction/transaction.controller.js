import { getTransactionsByUserId, addTransaction} from "./transaction.model.js"
import { createTransactionGroup } from "./transaction.model.js";
import { getTransactionGroupsByUserId } from "./transaction.model.js";
import { getTransactionsByGroupId } from "./transaction.model.js";
import {getRecentTransactionsByUserId} from "./transaction.model.js"
export const createTransactionGroupWithItems = async (req, res) => {
  try {
    const { user_id, group_name, transaction_date, transactions } = req.body;

    if (!user_id || !group_name || !transactions || transactions.length === 0) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Tính tổng amount
    const total_amount = transactions.reduce((sum, tx) => {
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
    }, 0);

    // Tạo transaction group
    const groupData = {
      user_id,
      group_name,
      total_amount,
      transaction_date: transaction_date || new Date().toISOString().split('T')[0]
    };

    const group_id = await createTransactionGroup(groupData);

    // Thêm từng transaction vào group
    for (const tx of transactions) {
      await addTransaction({
        ...tx,
        user_id,
        transaction_date: groupData.transaction_date,
        group_id
      });
    }

    res.status(201).json({ 
      message: "Tạo nhóm giao dịch thành công",
      group_id,
      total_amount
    });
  } catch (err) {
    console.error("Lỗi createTransactionGroupWithItems:", err);
    res.status(500).json({ message: "Lỗi server khi tạo nhóm giao dịch" });
  }
}
// lấy danh sách giao dịch với thời gian yêu cầu
export const getGroupTransactionHistory = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const dateFilter = req.query.date || null;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu user_id" });
    }

    console.log("Fetching groups with params:", { userId, limit, offset, dateFilter }); // Debug params
    const groups = await getTransactionGroupsByUserId(userId, limit, offset, dateFilter);
    res.json(groups);
  } catch (err) {
    console.error("Lỗi getGroupTransactionHistory:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách nhóm giao dịch" });
  }
};

export const getGroupTransactionDetail = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    if (!groupId) return res.status(400).json({ message: "Thiếu group_id" });

    const transactions = await getTransactionsByGroupId(groupId);
    res.json(transactions);
  } catch (err) {
    console.error("Lỗi getGroupTransactionDetail:", err);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết nhóm giao dịch" });
  }
}





//CATEGORY
export const getTransactionHistory = async (req, res) => {
  try {
    
    const userId = req.query.user_id  //lay user id
    const limit = req.query.limit ? parseInt(req.query.limit) : null  //lay limit nếu có tùy chọn 
    if (!userId) return res.status(400).json({ message: "Thiếu user_id" })

    const data = await getTransactionsByUserId(userId, limit)
    res.json(data)
  } catch (err) {
    console.error("Lỗi getTransactionHistory:", err)
    res.status(500).json({ message: "Lỗi server khi lấy lịch sử giao dịch" })
  }
}


export const createTransaction = async (req, res) => {
  try {
    const {
      user_id,
      amount,
      category_id,
      purpose_id,
      type,
      description,
      transaction_date
    } = req.body

    // Kiểm tra thông tin bắt buộc
    if (!user_id || !amount || !type || !transaction_date) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" })
    }

    const newId = await addTransaction({
      user_id,
      amount,
      category_id,
      purpose_id,
      type,
      description,
      transaction_date
    })

    res.status(201).json({ message: "Thêm giao dịch thành công", transaction_id: newId })
  } catch (err) {
    console.error("Lỗi createTransaction:", err)
    res.status(500).json({ message: "Lỗi server khi thêm giao dịch" })
  }
}


//lây 10 giao dịch gần nhất
export const getRecentTransactions = async (req, res) => {
  const { user_id, limit = 5, offset = 0 } = req.query;
  console.log("Query params:", user_id, limit, offset);
  try {
    const data = await getRecentTransactionsByUserId(Number(user_id), Number(limit), Number(offset));
    return res.json(data);
  } catch (error) {
    console.error("Lỗi getRecentTransactions:", error.message);
    return res.status(500).json({ error: "Lỗi server khi lấy giao dịch gần đây." });
  }
};
