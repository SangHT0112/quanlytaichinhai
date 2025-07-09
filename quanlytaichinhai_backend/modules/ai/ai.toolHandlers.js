import { addTransaction } from "../transaction/transaction.model.js"
import { getCategoryIdByKeyword } from "../category/category.model.js"

export const toolHandlers = {
  add_transaction: async (args) => {
    const { user_id = 1, so_tien, danh_muc, ngay } = args

   const category_id = await getCategoryIdByKeyword(data.danh_muc || data.description || "")

    if (!category_id) {
      return `❌ Không tìm thấy danh mục "${danh_muc}" trong hệ thống. Vui lòng thêm trước.`
    }

    const type = "expense"
    const description = `Chi cho ${danh_muc}`
    const transaction_date = ngay || new Date().toISOString().split("T")[0]

    await addTransaction({
      user_id,
      amount: so_tien,
      category_id,
      purpose_id: null,
      type,
      description,
      transaction_date,
    })

    return `✅ Đã ghi ${so_tien} đồng cho "${danh_muc}" vào ngày ${transaction_date}`
  },
}
