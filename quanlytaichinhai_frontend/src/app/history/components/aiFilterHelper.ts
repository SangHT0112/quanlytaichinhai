// utils/aiFilterHelper.ts
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
  if (msg.includes("tháng 6")) setFns.setFilterMonth("06")
  if (msg.includes("giải trí")) setFns.setFilterCategory("Giải trí")

  // Có thể mở rộng thêm…
}
