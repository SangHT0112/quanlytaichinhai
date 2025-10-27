"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import type { TransactionData } from "@/types/transaction"

interface ConfirmedMultiTransactionFormProps {
  groupName: string
  transactionDate: string
  transactions: TransactionData[]
  totalAmount: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}



export function ConfirmedMultiTransactionForm({
  groupName,
  transactions,
  totalAmount,
}: ConfirmedMultiTransactionFormProps) {
  const totalAmountCalculated = transactions.reduce((sum, txn) => {
    return txn.type === "income" ? sum + txn.amount : sum - txn.amount
  }, 0)

  const displayTotal = totalAmount !== 0 ? totalAmount : totalAmountCalculated

  // Nếu tổng > 0 thì xanh, < 0 thì đỏ
  const totalClass =
    displayTotal >= 0 ? "text-green-700" : "text-red-600"

  const signedTotal =
    (displayTotal >= 0 ? "+" : "-") + formatCurrency(Math.abs(displayTotal))

  return (
    <Card className="w-full max-w-md mx-auto border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="pt-1 pb-1 text-center space-y-2">
        {/* Icon + title */}
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <span className="text-lg font-semibold text-green-700">
            Nhóm giao dịch đã xác nhận
          </span>
        </div>

        {/* Info */}
        <div className="text-base text-gray-700 font-medium px-2 space-y-1">
          <div>{groupName || "Nhóm giao dịch"}</div>
          {/* <div>{formatDate(transactionDate)}</div> */}
        </div>

        {/* Total */}
        <div className={`text-4xl font-bold tracking-tight ${totalClass}`}>
          {signedTotal}
        </div>
      </CardContent>
    </Card>
  )
}
