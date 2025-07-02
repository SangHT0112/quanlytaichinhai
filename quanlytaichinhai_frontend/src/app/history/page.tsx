"use client"

import { useEffect, useState } from "react"
import LoginRequiredModal from "@/components/LoginRequiredModal"
import StatisticalSkeleton from "@/components/Skeleton/StatisticalSkeleton"
import SummaryCards from "./components/SummaryCards"
import FilterControls from "./components/FilterControls"
import TransactionItem from "./components/TransactionItem"
import { fetchHistoryTransactions } from "@/api/historyApi"
import { useFilteredTransactions } from "./components/useFilter"
export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [filterMonth, setFilterMonth] = useState("all")

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if(!userStr) {
      setIsLoggedIn(false)
      setIsLoading(false)
      return
    }
    
    const user = JSON.parse(userStr)
    setIsLoggedIn(true)
    fetchHistoryTransactions(user.user_id)
      .then((res) => {
        setTransactions(res)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Lỗi khi load lịch sử", err)
        setIsLoading(false)
      })
  }, [])

  const categories = [...new Set(transactions.map((t) => t.category))]
  const filteredTransactions = useFilteredTransactions(transactions, {
    searchTerm,
    filterType,
    filterCategory,
    filterMonth,
    sortBy
  })

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  if (isLoading) return <StatisticalSkeleton />

  return (
    <div className="space-y-6" id="transactions-history">
      <h1 className="text-3xl font-bold">Lịch sử giao dịch</h1>

      <SummaryCards 
        totalIncome={totalIncome} 
        totalExpense={totalExpense} 
      />

      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        categories={categories}
      />

      <div className="bg-gray-900 dark:bg-zinc-900 rounded-lg p-4 shadow">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách giao dịch</h2>
          <p className="text-sm text-gray-500">Hiển thị {filteredTransactions.length} giao dịch</p>
        </div>
        
        <div className="space-y-4">
          {filteredTransactions.slice(0, visibleCount).map((t) => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </div>

        {visibleCount < filteredTransactions.length && (
          <div className="text-center mt-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-md shadow transition-colors duration-200"
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>

      {!isLoggedIn && <LoginRequiredModal />}
    </div>
  )
}