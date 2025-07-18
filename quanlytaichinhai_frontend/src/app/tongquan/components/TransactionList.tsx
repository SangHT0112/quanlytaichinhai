"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format"
import { fetchTransactions } from "@/api/transactions/fetchTransactions"
import { useUser } from "@/contexts/UserProvider"
import axiosInstance from "@/config/axios"
import type { Transaction, TransactionDetail } from "@/types/transaction"
import { ChevronDown, ChevronUp, Receipt, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TransactionListProps {
  dateFilter?: string
  limit?: number | string
}

export default function TransactionList({ dateFilter, limit }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)
  const [groupDetails, setGroupDetails] = useState<Record<number, TransactionDetail[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null)
  const user = useUser()
  const userId = user?.user_id

  const resolveDateLabel = () => {
    const today = new Date()
    let targetDate = new Date()
    if (dateFilter === "yesterday") {
      targetDate.setDate(today.getDate() - 1)
    } else if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      // Nếu là chuỗi định dạng yyyy-mm-dd thì dùng luôn
      targetDate = new Date(dateFilter)
    } else {
      // Mặc định là hôm nay
      targetDate = today
    }

    return `Giao dịch ngày ${targetDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`
  }

  useEffect(() => {
    if (!userId) return

    const parsedLimit = Number(limit)
    const finalLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? undefined : parsedLimit

    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await fetchTransactions(userId, { dateFilter, limit: finalLimit })
        setTransactions(data)
      } catch (err) {
        console.error("Lỗi khi lấy danh sách giao dịch:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, dateFilter, limit])

  const toggleGroupDetails = async (groupId: number) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null)
      return
    }

    if (!groupDetails[groupId]) {
      try {
        setLoadingDetails(groupId)
        const res = await axiosInstance.get(`/transactions/groups/${groupId}`)
        setGroupDetails((prev) => ({ ...prev, [groupId]: res.data }))
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết group:", err)
      } finally {
        setLoadingDetails(null)
      }
    }

    setExpandedGroup(groupId)
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-slate-600">Đang tải giao dịch...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 shadow-lg">
      <CardContent className="p-6">
        {/* Header - Fixed */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Danh sách giao dịch</h2>
            <p className="text-slate-600 text-xs">{resolveDateLabel()}</p>
          </div>
        </div>

        {/* Transaction List - Scrollable */}
        {transactions.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
            <div className="space-y-4">
              {transactions.map((tx, idx) => (
                <Card
                  key={tx.group_id || idx}
                  className="bg-white/70 backdrop-blur-sm border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-0 relative w-100">
                    {/* Main Transaction Row */}
                    <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-semibold text-base">{tx.group_name}</span>
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Calendar className="w-4 h-4" />
                            {new Date(tx.transaction_date).toLocaleDateString("vi-VN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-slate-800 font-bold text-lg">
                            {formatCurrency(Number(tx.total_amount))}
                          </div>
                          {tx.transaction_count > 1 && (
                            <div className="text-slate-500 text-xs">{tx.transaction_count} giao dịch</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-2 top-13">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroupDetails(tx.group_id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        disabled={loadingDetails === tx.group_id}
                      >
                        {loadingDetails === tx.group_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        ) : expandedGroup === tx.group_id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Ẩn chi tiết
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Xem chi tiết
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    {expandedGroup === tx.group_id && (
                      <div className="bg-slate-50/50 border-t border-slate-200">
                        <div className="p-5 space-y-3">
                          <h4 className="font-semibold text-slate-700 mb-3 text-sm">Chi tiết giao dịch:</h4>
                          {(groupDetails[tx.group_id] || []).map((detail, idx2) => (
                            <div
                              key={detail.transaction_id || idx2}
                              className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex-1">
                                <div className="text-sm text-slate-800">
                                  {detail.description || detail.category_name}
                                </div>
                                <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(detail.transaction_date).toLocaleString("vi-VN")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-bold text-base ${
                                    detail.type === "expense" ? "text-red-500" : "text-green-500"
                                  }`}
                                >
                                  {detail.type === "expense" ? "-" : "+"}
                                  {formatCurrency(Number(detail.amount))}
                                </div>
                                <div className="text-xs text-slate-500 capitalize">
                                  {detail.type === "expense" ? "Chi tiêu" : "Thu nhập"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
              <Receipt className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Không có giao dịch</h3>
            <p className="text-slate-500 max-w-md text-sm">
              Chưa có giao dịch nào được ghi nhận. Hãy thêm giao dịch đầu tiên của bạn để bắt đầu theo dõi tài chính.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
