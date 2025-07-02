// components/useFilter.ts
import { useMemo } from "react"

export function useFilteredTransactions(transactions: any[], filters: {
  searchTerm: string
  filterType: string
  filterCategory: string
  filterMonth: string
  sortBy: string
}) {
  const { searchTerm, filterType, filterCategory, filterMonth, sortBy } = filters

  return useMemo(() => {
    return transactions
      .filter((t) => {
        const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase())
        const matchType = filterType === "all" || t.type === filterType
        const matchCategory = filterCategory === "all" || t.category === filterCategory
        const matchMonth = filterMonth === "all" || (new Date(t.date).getMonth() + 1 === Number(filterMonth))
        return matchSearch && matchType && matchCategory && matchMonth
      })
      .sort((a, b) => {
        if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
        if (sortBy === "amount") return b.amount - a.amount
        return 0
      })
  }, [transactions, searchTerm, filterType, filterCategory, filterMonth, sortBy])
}
