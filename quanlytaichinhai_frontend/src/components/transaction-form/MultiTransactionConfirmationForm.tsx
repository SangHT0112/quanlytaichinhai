"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, DollarSign, Tag, FileText, Pencil } from "lucide-react"
import { TransactionData } from "@/types/transaction"

interface MultiTransactionConfirmationFormProps {
  transactions: TransactionData[]
  onConfirmAll?: (data: TransactionData[]) => void
  onCancel?: () => void
  onEdit?: (index: number) => void
  isConfirmed?: boolean;
}

export default function MultiTransactionConfirmationForm({
  transactions,
  onConfirmAll,
  onCancel,
  onEdit,
  isConfirmed
}: MultiTransactionConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const handleConfirmAll = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onConfirmAll?.(transactions)
    } catch (err) {
      console.error("Lỗi xác nhận giao dịch:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = transactions.reduce((sum, txn) => {
    return txn.type === "income" ? sum + txn.amount : sum - txn.amount
  }, 0)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Xác nhận nhiều giao dịch
        </CardTitle>
        <CardDescription>
          Kiểm tra lại tất cả thông tin trước khi xác nhận ({transactions.length} giao dịch)
        </CardDescription>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Tổng thay đổi số dư:</p>
          <p className={`text-lg font-bold ${totalAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {transactions.map((txn, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 relative group hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => onEdit?.(index)}>
                <Pencil className="w-4 h-4 mr-1" />
                Sửa
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Giao dịch #{index + 1}</span>
              <Badge className={txn.type === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white"}>
                {txn.type === "expense" ? "Chi tiêu" : "Thu nhập"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Số tiền</p>
                  <p className={`text-lg font-bold ${txn.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                    {txn.type === "expense" ? "-" : "+"}
                    {formatCurrency(txn.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Danh mục</p>
                  <p className="text-sm text-muted-foreground">{txn.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ngày giao dịch</p>
                  <p className="text-sm text-muted-foreground">{formatDate(txn.transaction_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mô tả</p>
                  <p className="text-sm text-muted-foreground">{txn.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Tổng cộng: {transactions.length} giao dịch</div>
        <div className="flex gap-3 mr-5">
            <Button variant="outline" onClick={onCancel}>
                Hủy
            </Button>
            <Button
                onClick={() => onConfirmAll?.(transactions)}
                disabled={isConfirmed || isSubmitting}
                className="bg-green-600 text-white"
                >
                {isConfirmed ? "Đã xác nhận" : isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>

        </div>
      </CardFooter>
    </Card>
  )
}
