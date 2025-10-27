  "use client"

  import { Card, CardContent } from "@/components/ui/card"
  import { CheckCircle2 } from "lucide-react"
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

    // Nếu income thì thêm dấu +, nếu expense thì thêm dấu -
    const signedAmount =
      (transaction.type === "income" ? "+" : "-") + formatCurrency(transaction.amount)

    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="pt-1 pb-1 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-lg font-semibold text-green-700">Đã xác nhận</span>
          </div>

          <div className="text-base text-gray-700 font-medium px-5">
            {transaction.description}
          </div>

          <div
            className={`text-4xl font-bold tracking-tight ${
              transaction.type === "income" ? "text-green-700" : "text-red-600"
            }`}
          >
            {signedAmount}
          </div>
        </CardContent>
      </Card>
    )
  }
