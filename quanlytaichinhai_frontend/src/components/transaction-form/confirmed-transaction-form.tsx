"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import type { TransactionData } from "@/types/transaction"

interface ConfirmedTransactionFormProps {
  transaction: TransactionData
}

export function ConfirmedTransactionForm({ transaction }: ConfirmedTransactionFormProps) {
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }

  const isIncome = transaction.type === "income"
  const signedAmount = (isIncome ? "+" : "-") + formatCurrency(transaction.amount)

  return (
    <div className="w-full max-w-lg min-w-[340px] mx-auto p-3">
      <Card className="border-0 shadow-lg bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 ${
              isIncome ? "bg-green-600" : "bg-red-600"
            } text-white`}
          >
            <div className="flex items-center gap-2">
              {isIncome ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <h2 className="text-base font-semibold">
                {isIncome ? "Thu nhập" : "Chi tiêu"}
              </h2>
            </div>
            <CheckCircle2 className="w-5 h-5 opacity-90" />
          </div>

          {/* Amount */}
          <div className="p-2 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Số tiền</p>
            <p
              className={`text-4xl font-bold ${
                isIncome ? "text-green-600" : "text-red-600"
              } tracking-tight`}
            >
              {signedAmount}
            </p>
          </div>

          {/* Description */}
          <div className="px-5 py-1 border-t border-border">
            <p className="text-sm text-foreground line-clamp-2 font-medium">
              {transaction.description || "Không có mô tả giao dịch"}
            </p>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-4 px-5 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Thời gian</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(transaction.date || new Date())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Trạng thái</p>
                <p className="text-sm font-semibold text-green-600">Hoàn tất</p>
              </div>
            </div>
          </div>

          {/* Footer */}
         
        </CardContent>
      </Card>
    </div>
  )
}
