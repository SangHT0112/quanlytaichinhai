import { getTransactionsByUserId } from "./transaction.model.js"

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