"use client"

import { Search } from "lucide-react"

interface FilterControlsProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  filterType: string
  setFilterType: (value: string) => void
  filterCategory: string
  setFilterCategory: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  filterMonth: string
  setFilterMonth: (value: string) => void
  categories: string[]
}

export default function FilterControls({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  sortBy,
  setSortBy,
  filterMonth,
  setFilterMonth,
  categories = [], // Default empty array to prevent map error
}: FilterControlsProps) {
  return (
    <div className="bg-white dark:bg-white rounded-lg p-4 shadow border space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Bộ lọc và tìm kiếm</h2>
      <div className="grid gap-4 md:grid-cols-5">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-2 border rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả</option>
          <option value="income">Thu nhập</option>
          <option value="expense">Chi tiêu</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sắp xếp theo ngày</option>
          <option value="amount">Sắp xếp theo số tiền</option>
        </select>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả tháng</option>
          {Array.from({ length: 12 }, (_, i) => {
            const month = (i + 1).toString().padStart(2, "0")
            return (
              <option key={month} value={month}>
                Tháng {month}
              </option>
            )
          })}
        </select>
      </div>
    </div>
  )
}
