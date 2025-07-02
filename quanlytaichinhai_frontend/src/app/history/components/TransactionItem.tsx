"use client"

import { formatCurrency} from "@/lib/format"
import { getCategoryColor, formatDate } from "@/lib/transactionUtils"

interface TransactionItemProps {
  transaction: {
    id: string
    type: "income" | "expense"
    description: string
    category: string
    date: string
    amount: number
  }
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-800 dark:hover:bg-gray-800">
      <div className="flex items-center space-x-4">
        <div className={`w-3 h-3 rounded-full ${transaction.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
        <div>
          <div className="flex items-center gap-2 font-medium">
            {transaction.description}
            <span className={`${getCategoryColor(transaction.category)} text-white text-xs px-2 py-0.5 rounded-full`}>
              {transaction.category}
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
        </div>
      </div>
      <div className={`text-lg font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
        {transaction.type === "income" ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  )
}