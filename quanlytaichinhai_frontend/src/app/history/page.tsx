"use client"

import { useEffect, useState } from "react"
import LoginRequiredModal from "@/components/Layouts/LoginRequiredModal"
import StatisticalSkeleton from "@/components/Skeleton/StatisticalSkeleton"
import SummaryCards from "./components/SummaryCards"
import FilterControls from "./components/FilterControls"
import TransactionItem from "./components/TransactionItem"
import { fetchHistoryTransactions } from "@/api/historyApi"
import { useFilteredTransactions } from "./components/useFilter"
import { applyFilterFromAi } from "./components/aiFilterHelper"
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
  const categories = [...new Set(transactions.map((t) => t.category))]
  console.log("Unique categories:", [...new Set(transactions.map(t => t.category))]);
  const filteredTransactions = useFilteredTransactions(transactions, {
    searchTerm,
    filterType,
    filterCategory,
    filterMonth,
    sortBy
  })
  // console.log("Current filters:", {
  //   filterType,
  //   filterCategory, // Kiểm tra xem giá trị này có đúng là "Ăn uống" không
  //   filterMonth,
  //   searchTerm
  // });
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  
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

  useEffect(() => {
    const handleChatMessage = (event: MessageEvent) => {
    if (event.data?.type === "FILTER") {
      const { message } = event.data.payload;
      applyFilterFromAi(message, {
        setFilterType,
        setFilterCategory,
        setFilterMonth,
        setSearchTerm
      }, categories); // Truyền categories vào
    }
  };

    window.addEventListener("message", handleChatMessage)
    return () => window.removeEventListener("message", handleChatMessage)
  }, [categories])
  // Trong TransactionHistory component
  useEffect(() => {
    const handleApplyFilter = (event: MessageEvent) => {
      if (event.data?.type === 'APPLY_FILTER') {
        const { message } = event.data.payload;
        applyFilterFromAi(message, {
          setFilterType,
          setFilterCategory,
          setFilterMonth,
          setSearchTerm
        });
        
        // Highlight kết quả
        setTimeout(() => {
          const element = document.getElementById('transactions-history');
          element?.classList.add('bg-blue-500/10');
          setTimeout(() => element?.classList.remove('bg-blue-500/10'), 2000);
        }, 500);
      }
    };

    window.addEventListener('message', handleApplyFilter);
    return () => window.removeEventListener('message', handleApplyFilter);
  }, []);

  // Trong trang History
  useEffect(() => {
    // Xử lý pending search từ localStorage
    const pendingSearch = localStorage.getItem('pendingSearch');
    if (pendingSearch) {
      localStorage.removeItem('pendingSearch');
      
      // Đặt giá trị tìm kiếm và reset các filter khác
      setSearchTerm(pendingSearch);
      setFilterType('all');
      setFilterCategory('all');
      setFilterMonth('all');
      
      // Scroll đến phần kết quả
      setTimeout(() => {
        const element = document.getElementById('transactions-history');
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    // Xử lý message APPLY_SEARCH
    const handleSearchMessage = (event: MessageEvent) => {
      if (event.data?.type === 'APPLY_SEARCH') {
        const { keyword } = event.data.payload;
        setSearchTerm(keyword);
        setFilterType('all');
        setFilterCategory('all');
        setFilterMonth('all');
      }
    };

    window.addEventListener('message', handleSearchMessage);
    return () => window.removeEventListener('message', handleSearchMessage);
  }, []);


  useEffect(() => {
    // Xử lý pending filter từ localStorage
    const pendingFilter = localStorage.getItem('pendingFilter');
    if (pendingFilter) {
      localStorage.removeItem('pendingFilter');
      applyFilterFromAi(pendingFilter, {
        setFilterType,
        setFilterCategory,
        setFilterMonth,
        setSearchTerm
      });
    }
    // Xử lý filter từ URL parameters (nếu cần)
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter) {
      applyFilterFromAi(filter, {
        setFilterType,
        setFilterCategory,
        setFilterMonth,
        setSearchTerm
      });
    }
  }, [categories]);
  
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