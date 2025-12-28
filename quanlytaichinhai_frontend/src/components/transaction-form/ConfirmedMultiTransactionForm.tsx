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
  // transactionDate, // Không dùng ở đây
  transactions,
}: ConfirmedMultiTransactionFormProps) {
    
  // BƯỚC 1: Luôn tính toán tổng với dấu (- cho expense, + cho income)
  const totalAmountCalculated = transactions.reduce((sum, txn) => {
    // Chi tiêu sẽ bị trừ đi, đảm bảo ra số ÂM nếu chỉ có chi tiêu.
    return txn.type === "income" ? sum + txn.amount : sum - txn.amount
  }, 0)

  // BƯỚC 2: Chỉ sử dụng totalAmountCalculated để xác định dấu và màu sắc
  // (Loại bỏ kiểm tra totalAmount !== 0 để tránh lỗi từ JSON)
  const displayTotal = totalAmountCalculated 

  // BƯỚC 3: Xác định class và dấu dựa trên displayTotal (đang là -213500)
  
  // Nếu tổng > 0 (Thu nhập) thì xanh, < 0 (Chi tiêu) thì đỏ
  const totalClass =
    displayTotal >= 0 ? "text-green-700" : "text-red-600" // -> text-red-600

  // Thêm dấu + nếu Thu nhập, hoặc dấu - nếu Chi tiêu (bằng cách dùng Math.abs)
  const signedTotal =
    (displayTotal >= 0 ? "+" : "-") + formatCurrency(Math.abs(displayTotal)) // -> -213.500 ₫

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