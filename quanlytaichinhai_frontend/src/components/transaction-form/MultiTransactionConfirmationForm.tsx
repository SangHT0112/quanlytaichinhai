"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Pencil, Calendar } from "lucide-react"
import type { TransactionData } from "@/types/transaction"

interface MultiTransactionConfirmationFormProps {
  transactions: TransactionData[]
  groupName: string
  transactionDate: string
  onConfirmAll?: (data: TransactionData[]) => void
  onCancel?: () => void
  onEdit?: (index: number) => void
  isConfirmed?: boolean
}

export default function MultiTransactionConfirmationForm({
  transactions,
  groupName,
  transactionDate,
  onConfirmAll,
  onCancel,
  onEdit,
  isConfirmed,
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Xác nhận giao dịch nhóm
        </CardTitle>

        {/* Enhanced transaction info section */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Content Card */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Nội dung giao dịch</span>
                </div>
                <p className="text-lg font-bold text-blue-900 break-words">{groupName}</p>
              </CardContent>
            </Card>

            {/* Transaction Date Card */}
            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Ngày giao dịch</span>
                </div>
                <p className="text-lg font-bold text-purple-900">{formatDate(transactionDate)}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Total amount section */}
        <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
          <p className="text-sm font-medium text-slate-600 mb-1">Tổng thay đổi số dư:</p>
          <p className={`text-xl font-bold ${totalAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={txn.description}>
                  {txn.description}
                </TableCell>
                 <TableCell
                  className={`text-right font-bold ${txn.type === "expense" ? "text-red-600" : "text-green-600"}`}
                >
                  {txn.type === "expense" ? "-" : "+"}
                  {formatCurrency(txn.amount)}
                </TableCell>
                <TableCell>{txn.category}</TableCell>

                <TableCell>
                  <Badge className={txn.type === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white"}>
                    {txn.type === "expense" ? "Chi tiêu" : "Thu nhập"}
                  </Badge>
                </TableCell>
               
               
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(index)} className="h-8">
                    <Pencil className="w-4 h-4 mr-1" />
                    Sửa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Gồm {transactions.length} mục trong nhóm</div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmAll}
            disabled={isConfirmed || isSubmitting}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isConfirmed ? "Đã xác nhận" : isSubmitting ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
