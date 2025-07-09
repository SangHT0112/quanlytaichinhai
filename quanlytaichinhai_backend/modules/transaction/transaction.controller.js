import { getTransactionsByUserId, addTransaction} from "./transaction.model.js"

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