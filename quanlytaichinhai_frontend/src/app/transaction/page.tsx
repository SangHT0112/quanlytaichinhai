"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import axiosInstance from "@/config/axios"
import CategoryCard from "./category-card"

interface Category {
  category_id: number
  name: string
  type: string
  icon: string
  user_id: number | null
}

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  icon: string
  date: string
}

interface User {
  user_id: number
  // Thêm các trường khác nếu cần, ví dụ: email: string; name: string;
}

type TransactionParams = {
  user_id: number
  limit: number
  category_id?: number
}

const API_BASE = "/transactions"
const CATEGORY_BASE = "/category"
const ITEMS_PER_CARD = 3 // Hiển thị tối đa 3 giao dịch trên mỗi thẻ

const TransactionsPage: React.FC = () => {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const loadCategories = async (userId: number): Promise<void> => {
    try {
      const response = await axiosInstance.get(CATEGORY_BASE, {
        params: { user_id: userId },
      })
      setCategories(response.data)
    } catch (error: unknown) {
      const err = error as AxiosError
      console.error("Lỗi load categories:", err.response?.data || err.message)
    }
  }

  const loadTransactions = async (userId: number): Promise<void> => {
    setLoading(true)
    try {
      const params: TransactionParams = { user_id: userId, limit: 50 }
      if (selectedCategoryId) {
        params.category_id = Number(selectedCategoryId)
      }

      const response = await axiosInstance.get(API_BASE, { params })
      setFilteredTransactions(response.data)
      setExpandedCategories(new Set()) // Reset expanded state
    } catch (error: unknown) {
      const err = error as AxiosError
      console.error("Lỗi load transactions:", err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupTransactions = (txs: Transaction[]) => {
    const grouped: { [key: string]: { icon: string; items: Transaction[] } } = {}
    txs.forEach((tx) => {
      const catName = tx.category || "Không rõ"
      const catIcon = tx.icon
      if (!grouped[catName]) {
        grouped[catName] = { icon: catIcon, items: [] }
      }
      grouped[catName].items.push(tx)
    })
    return grouped
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCategoryId(e.target.value)
  }

  const handleDeleteTransaction = async (id: number): Promise<void> => {
    if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return
    if (!currentUser?.user_id) return
    try {
      await axiosInstance.delete(`${API_BASE}/${id}`)
      loadTransactions(currentUser.user_id)
    } catch (error: unknown) {
      const err = error as AxiosError
      console.error("Lỗi xóa:", err.response?.data || err.message)
    }
  }

  const toggleExpanded = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  // Check authentication on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      if (!user || !user.user_id) {
        router.push('/login')
        return
      }
      setCurrentUser(user)
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      router.push('/login')
    }
  }, [router])

  // Load categories if user is authenticated
  useEffect(() => {
    if (currentUser?.user_id) {
      loadCategories(currentUser.user_id)
    }
  }, [currentUser?.user_id])

  // Load transactions if user is authenticated
  useEffect(() => {
    if (currentUser?.user_id) {
      loadTransactions(currentUser.user_id)
    }
  }, [selectedCategoryId, currentUser?.user_id])

  // Redirect if user becomes null (e.g., logged out from another tab)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        try {
          const newUser = JSON.parse(e.newValue || 'null')
          setCurrentUser(newUser)
          if (!newUser?.user_id) {
            router.push('/login')
          }
        } catch {
          setCurrentUser(null)
          router.push('/login')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [router])

  if (!currentUser?.user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    )
  }

  const grouped = groupTransactions(filteredTransactions)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 text-balance">Lịch Sử Giao Dịch</h1>
          <p className="text-slate-600">Quản lý và theo dõi tất cả các giao dịch của bạn</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="categoryFilter" className="block text-sm font-semibold text-slate-700 mb-2">
                Lọc theo danh mục
              </label>
              <select
                id="categoryFilter"
                value={selectedCategoryId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="">Tất cả danh mục ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => currentUser?.user_id && loadTransactions(currentUser.user_id)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Tải mới
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Category Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([catName, group]) => (
              <CategoryCard
                key={catName}
                categoryName={catName}
                icon={group.icon}
                items={group.items}
                isExpanded={expandedCategories.has(catName)}
                onToggleExpand={() => toggleExpanded(catName)}
                onDelete={handleDeleteTransaction}
                maxInitialItems={ITEMS_PER_CARD}
              />
            ))}

            {Object.keys(grouped).length === 0 && (
              <div className="col-span-full flex justify-center py-12">
                <p className="text-slate-500 text-lg">Không có giao dịch nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionsPage