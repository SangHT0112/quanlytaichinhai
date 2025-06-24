"use client"

import { useState } from "react"
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"

const mockTransactions = [
  { id: 1, date: "2024-01-15", type: "expense", category: "Ăn uống", amount: 150000, description: "Ăn trưa với đồng nghiệp" },
  { id: 2, date: "2024-01-15", type: "expense", category: "Di chuyển", amount: 25000, description: "Grab về nhà" },
  { id: 3, date: "2024-01-14", type: "income", category: "Lương", amount: 15000000, description: "Lương tháng 1" },
  { id: 4, date: "2024-01-14", type: "expense", category: "Mua sắm", amount: 500000, description: "Mua quần áo" },
  { id: 5, date: "2024-01-13", type: "expense", category: "Giải trí", amount: 200000, description: "Xem phim" },
  { id: 6, date: "2024-01-13", type: "expense", category: "Ăn uống", amount: 80000, description: "Trà sữa và bánh" },
  { id: 7, date: "2024-01-12", type: "expense", category: "Hóa đơn", amount: 300000, description: "Tiền điện tháng 12" },
  { id: 8, date: "2024-01-12", type: "expense", category: "Y tế", amount: 120000, description: "Khám bệnh" },
]
const getCategoryColor = (category: string) => {
  switch (category) {
    case "Ăn uống":
      return "bg-pink-500"
    case "Di chuyển":
      return "bg-blue-500"
    case "Lương":
      return "bg-green-600"
    case "Mua sắm":
      return "bg-purple-500"
    case "Giải trí":
      return "bg-yellow-500"
    case "Hóa đơn":
      return "bg-red-500"
    case "Y tế":
      return "bg-rose-500"
    default:
      return "bg-gray-500"
  }
}


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const categories = [...new Set(mockTransactions.map((t) => t.category))]

  const filteredTransactions = mockTransactions
    .filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === "all" || t.type === filterType
      const matchesCategory = filterCategory === "all" || t.category === filterCategory
      return matchesSearch && matchesType && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === "amount") return b.amount - a.amount
      return 0
    })

  const totalIncome = mockTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = mockTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Lịch sử giao dịch</h1>

      {/* Tổng quan */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span>Tổng thu nhập</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
        </div>

        <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span>Tổng chi tiêu</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
        </div>

        <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span>Số dư ròng</span>
            <ArrowUpDown className="w-4 h-4 text-blue-600" />
          </div>
          <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Bộ lọc và tìm kiếm</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 py-2 border rounded-md bg-transparent text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full py-2 px-3 border rounded-md bg-transparent text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="income">Thu nhập</option>
            <option value="expense">Chi tiêu</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full py-2 px-3 border rounded-md bg-transparent text-sm"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full py-2 px-3 border rounded-md bg-transparent text-sm"
          >
            <option value="date">Ngày</option>
            <option value="amount">Số tiền</option>
          </select>
        </div>
      </div>

      {/* Danh sách giao dịch */}
      <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách giao dịch</h2>
          <p className="text-sm text-gray-500">Hiển thị {filteredTransactions.length} giao dịch</p>
        </div>
        <div className="space-y-4">
          {filteredTransactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-800 dark:hover:bg-gray-800"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${t.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {t.description}
                    <span className={`${getCategoryColor(t.category)} text-white text-xs px-2 py-0.5 rounded-full`}>
                      {t.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(t.date)}</p>
                </div>
              </div>
              <div className={`text-lg font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                {t.type === "income" ? "+" : "-"}
                {formatCurrency(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
