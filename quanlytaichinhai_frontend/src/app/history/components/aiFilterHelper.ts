export function applyFilterFromAi(message: string, setFns: {
  setFilterType: (val: string) => void
  setFilterCategory: (val: string) => void
  setFilterMonth: (val: string) => void
  setSearchTerm: (val: string) => void
}) {
  const msg = message.toLowerCase()

  if (msg.includes("chi tiêu")) setFns.setFilterType("expense")
  if (msg.includes("thu nhập")) setFns.setFilterType("income")

  if (msg.includes("ăn uống")) setFns.setFilterCategory("Ăn uống")
  if (msg.includes("mua sắm")) setFns.setFilterCategory("Mua sắm")
  if (msg.includes("giải trí")) setFns.setFilterCategory("Giải trí")

  if (msg.includes("tháng 6")) setFns.setFilterMonth("6")
  if (msg.includes("tháng 7")) setFns.setFilterMonth("7")

  // fallback nếu không khớp gì hết → set ô tìm kiếm
  setFns.setSearchTerm(message)
}
