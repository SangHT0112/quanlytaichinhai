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
        // Chuẩn hóa chuỗi Unicode và xử lý case sensitivity
        //Cho phép tìm kiếm không phân biệt hoa thường hoặc dấu (ví dụ: "Luong" khớp với "Lương").
        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        
        const matchSearch = searchTerm === "" || 
                          normalize(t.description).includes(normalize(searchTerm)) || 
                          normalize(t.category).includes(normalize(searchTerm))
        
        // So sánh category chính xác (không phân biệt hoa thường)
        const matchCategory = filterCategory === "all" || 
                            normalize(t.category) === normalize(filterCategory)
        
        const matchType = filterType === "all" || t.type === filterType
        const matchMonth = filterMonth === "all" || 
                          (new Date(t.date).getMonth() + 1 === Number(filterMonth))
        
        return matchSearch && matchType && matchCategory && matchMonth
      })
      .sort((a, b) => {
        if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
        if (sortBy === "amount") return b.amount - a.amount
        return 0
      })
  }, [transactions, searchTerm, filterType, filterCategory, filterMonth, sortBy])
}