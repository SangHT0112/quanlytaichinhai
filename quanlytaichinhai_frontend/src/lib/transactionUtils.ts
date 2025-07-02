export const getCategoryColor = (category: string) => {
  switch (category) {
    case "Ăn uống": return "bg-pink-500"
    case "Di chuyển": return "bg-blue-500"
    case "Lương": return "bg-green-600"
    case "Mua sắm": return "bg-purple-500"
    case "Giải trí": return "bg-yellow-500"
    case "Hóa đơn": return "bg-black-500"
    case "Y tế": return "bg-rose-500"
    case "Giáo dục": return "bg-gray-500"
    case "Nhà cửa": return "bg-violet-500"
    default: return "bg-gray-500"
  }
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })