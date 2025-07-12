"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Calendar, DollarSign, Tag, User, FileText } from "lucide-react"

export interface TransactionData {
  user_id: number
  amount: number
  category: string
  type: "expense" | "income"
  description: string
  transaction_date: string
  disabled?: boolean
}

interface TransactionConfirmationFormProps {
  transactionData: TransactionData
  onConfirm?: (data: TransactionData) => void
  onCancel?: () => void
  isConfirmed?: boolean 
   onEdit?: () => void 
}

export default function TransactionConfirmationForm({
  transactionData = {
    user_id: 1,
    amount: 50000,
    category: "Ăn uống",
    type: "expense",
    description: "Ăn sáng",
    transaction_date: "2025-07-04",
  },
  onConfirm,
  onCancel,
  isConfirmed = false,
  onEdit
}: TransactionConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }


  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onConfirm?.(transactionData)
    } catch (error) {
      console.error("Error confirming transaction:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Xác nhận giao dịch
        </CardTitle>
        <CardDescription>Vui lòng kiểm tra thông tin giao dịch trước khi xác nhận</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Loại giao dịch</span>
         <Badge
            className={transactionData.type === "expense" 
              ? "bg-red-500 text-white" 
              : "bg-green-500 text-white"}
          >
            {transactionData.type === "expense" ? "Chi tiêu" : "Thu nhập"}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Số tiền</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(transactionData.amount)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Danh mục</p>
              <p className="text-sm text-muted-foreground">{transactionData.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Ngày giao dịch</p>
              <p className="text-sm text-muted-foreground">{formatDate(transactionData.transaction_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Mô tả</p>
              <p className="text-sm text-muted-foreground">{transactionData.description}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3  min-w-[300px]">
        {isConfirmed ? onEdit && (
          <Button className="w-full justify-center" disabled>
            <CheckCircle className="h-4 w-4 mr-2" />
            Đã xác nhận
          </Button>
        ) : (
          <>
            <Button onClick={onEdit}>Sửa</Button>
            <Button
              className="flex-1 bg-green-600 text-white"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </>
        )}
      </CardFooter>


    </Card>
  )
}
