"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Calendar, TrendingUp, TrendingDown } from "lucide-react"
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

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

export function ConfirmedMultiTransactionForm({
  groupName,
  transactionDate,
  transactions = [],
}: ConfirmedMultiTransactionFormProps) {
  const totalAmountCalculated = (transactions || []).reduce((sum, txn) => {
    return txn.type === "income" ? sum + txn.amount : sum - txn.amount
  }, 0)

  const isIncome = totalAmountCalculated >= 0
  const displayTotal = Math.abs(totalAmountCalculated)
  const signedTotal = (isIncome ? "+" : "-") + formatCurrency(displayTotal)

  const transactionCount = transactions?.length || 0
  const incomeCount = transactions?.filter((t) => t.type === "income").length || 0
  const expenseCount = transactions?.filter((t) => t.type === "expense").length || 0

  return (
    <div className="w-full max-w-lg min-w-[340px] mx-auto p-3">
      <Card className="border-0 shadow-lg bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div
            className={`flex items-center justify-between px-4 py-2 ${
              isIncome ? "bg-green-600" : "bg-red-600"
            } text-white`}
          >
            <div className="flex items-center gap-2">
              {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <h2 className="text-sm font-semibold">{isIncome ? "Thu nhập" : "Chi tiêu"}</h2>
            </div>
            <CheckCircle2 className="w-4 h-4 opacity-90" />
          </div>

          <div className="px-5 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Nhóm giao dịch</p>
            <p className="text-base font-semibold text-foreground">{groupName || "Nhóm giao dịch"}</p>
          </div>

          <div className="px-5 py-2 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Số tiền</p>
            <p className={`text-3xl font-bold ${isIncome ? "text-green-600" : "text-red-600"} tracking-tight`}>
              {signedTotal}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 px-5 py-2 border-t border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Trạng thái</p>
                <p className="text-xs font-semibold text-green-600">Hoàn tất</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Ngày</p>
                <p className="text-xs font-semibold text-foreground">{formatDate(transactionDate)}</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground uppercase font-medium">Chi tiết giao dịch</p>
            <div className="flex gap-3 mt-1">
              <span className="text-xs font-medium">
                <span className="text-green-600">{incomeCount}</span> Thu nhập
              </span>
              <span className="text-xs font-medium">
                <span className="text-red-600">{expenseCount}</span> Chi tiêu
              </span>
              <span className="text-xs font-medium">Tổng: {transactionCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
