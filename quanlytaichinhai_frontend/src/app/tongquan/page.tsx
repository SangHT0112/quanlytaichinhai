"use client"
import { useEffect, useState } from "react"
import WeeklyBarChart from "@/app/tongquan/components/WeeklyBarChart"
import BalanceCardPage from "./components/BalanceCard"
import OverviewSkeleton from "@/components/Skeleton/OverviewSkeleton"
import TopExpenseCategories from "./components/TopExpenseCategories"
import TransactionList from "./components/TransactionList"

interface User {
  user_id: number
}

export interface TopCategory {
  category_name: string
  total_amount: number
  icon: string
  color: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      setIsLoggedIn(false)
      setIsLoadingData(false)
      return
    }

    try {
      const parsedUser: User = JSON.parse(userStr)
      if (!parsedUser.user_id) throw new Error("Missing user_id")

      setUser(parsedUser)
      setIsLoggedIn(true)

      } catch (error) {
        console.error("Lỗi khi parse user:", error)
        setIsLoggedIn(false)
        setIsLoadingData(false)
      } 
    }, [])

  if (isLoadingData) {
    return <OverviewSkeleton isLoggedIn={isLoggedIn} />
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tổng quan tài chính</h1>

        <BalanceCardPage />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.user_id && <TopExpenseCategories />}
          {user?.user_id && <TransactionList />}
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Chi tiêu trong tuần</h3>
          <div className="h-40">
            <WeeklyBarChart />
          </div>
        </div>
      </main>
    </div>
  )
}
