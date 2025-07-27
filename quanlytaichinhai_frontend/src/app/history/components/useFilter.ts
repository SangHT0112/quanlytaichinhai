import { useMemo } from "react"
import { Transaction } from "../types"
export interface FilterOptions {
  searchTerm: string
  filterType: string
  filterCategory: string
  filterMonth: string
  sortBy: string
}

export function useFilteredTransactions(
  transactions: Transaction[],
  filters: FilterOptions
) {
  const { searchTerm, filterType, filterCategory, filterMonth, sortBy } = filters

  return useMemo(() => {
    return transactions
      .filter((t) => {
        const normalize = (str: string) =>
          str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

        const matchSearch =
          searchTerm === "" ||
          normalize(t.description ?? "").includes(normalize(searchTerm)) ||
          normalize(t.category).includes(normalize(searchTerm))

        const matchCategory =
          filterCategory === "all" ||
          normalize(t.category) === normalize(filterCategory)

        const matchType = filterType === "all" || t.type === filterType

        const matchMonth =
          filterMonth === "all" ||
          new Date(t.date).getMonth() + 1 === Number(filterMonth)

        return matchSearch && matchType && matchCategory && matchMonth
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        if (sortBy === "amount") {
          return b.amount - a.amount
        }
        return 0
      })
  }, [transactions, searchTerm, filterType, filterCategory, filterMonth, sortBy])
}
