"use client"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format"
import { fetchRecentTransactions } from "@/api/historyApi"

interface Props {
  userId: number
}

export default function TransactionList({ userId }: Props) {
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return
    fetchRecentTransactions(userId, 5)
      .then(setTransactions)
      .catch((err) => console.error("Lỗi khi load giao dịch gần nhất:", err))
  }, [userId])

  return (
    <div className="bg-zinc-800 p-4 rounded-xl shadow space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">🧾</span>
          </div>
          <h3 className="text-xl font-bold text-white">Giao dịch gần đây</h3>
        </div>
        <button className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded">
          Xem tất cả
        </button>
      </div>

      {/* Danh sách giao dịch */}
      {transactions.length > 0 ? (
        transactions.map((txn) => (
          <div
            key={txn.id}
            className="group flex items-center justify-between p-4 bg-zinc-700/30 hover:bg-zinc-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] border border-zinc-600/20"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg w-12 h-12 text-xl flex items-center justify-center ${
                txn.type === 'income'
                  ? 'bg-emerald-900/30 text-emerald-400'
                  : 'bg-rose-900/30 text-rose-400'
              }`}>
                {txn.icon || (txn.type === 'income' ? '💰' : '💸')}
              </div>
              <div>
                <p className="font-medium text-white">{txn.category}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(txn.date).toLocaleDateString('vi-VN')} • {txn.description}
                </p>
              </div>
            </div>
            <div className={`font-medium ${
              txn.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-zinc-400 py-10">
          Không có giao dịch gần đây.
        </div>
      )}
    </div>
  )
}
