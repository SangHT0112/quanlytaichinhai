export interface Transaction {
  id: number
  amount: number
  type: "income" | "expense"
  category: string
  description: string
  date: string
  note?: string
}
