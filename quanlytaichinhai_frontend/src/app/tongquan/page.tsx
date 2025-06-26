"use client"
import { useEffect, useState } from "react"
import ExpensePieChart from "@/components/charts/ExpensePieChart"
import WeeklyBarChart from "@/components/charts/WeeklyBarChart"
import LoginRequiredModal from "@/components/LoginRequiredModal"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (user) {
      setIsLoggedIn(true)

      // Giả lập delay tải dữ liệu
      const timer = setTimeout(() => {
        setIsLoadingData(false)
      }, 2000)

      return () => clearTimeout(timer)
    } else {
      // Nếu chưa đăng nhập thì giữ loading mãi
      setIsLoggedIn(false)
      setIsLoadingData(true)
    }
  }, [])

  if (isLoadingData) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center  px-4 py-0 animate-pulse text-white">
      {/* Khung tổng quan giả (skeleton) */}
      <div className="w-full max-w-4xl space-y-4">
        {/* 3 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="bg-zinc-800 p-4 rounded-xl shadow space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-600 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Biểu đồ giả */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-800 p-4 rounded-xl shadow h-40" />
          <div className="bg-zinc-800 p-4 rounded-xl shadow h-40" />
        </div>

        {/* Biểu đồ thanh */}
        <div className="bg-zinc-800 p-4 rounded-xl shadow h-40" />
      </div>

      {/* Nếu chưa đăng nhập, hiển thị modal */}
      {!isLoggedIn && <LoginRequiredModal />}
    </div>
  )
}

  

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tổng quan tài chính</h1>

        {/* 3 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-sm text-gray-400">Số dư hiện tại</h3>
            <p className="text-2xl font-semibold text-green-400">15.750.000 ₫</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-sm text-gray-400">Thu nhập tháng này</h3>
            <p className="text-2xl font-semibold text-green-400">8.500.000 ₫</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-sm text-gray-400">Chi tiêu tháng này</h3>
            <p className="text-2xl font-semibold text-red-400">4.200.000 ₫</p>
          </div>
        </div>

        {/* Thống kê danh mục và biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-2">Top danh mục chi tiêu</h3>
            <ul className="space-y-1 text-sm">
              <li>🍔 Ăn uống – 1.500.000 ₫</li>
              <li>🚗 Di chuyển – 900.000 ₫</li>
              <li>🎮 Giải trí – 750.000 ₫</li>
            </ul>
          </div>
          <div className="bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-2">Biểu đồ chi tiêu</h3>
            <div className="h-40">
              <ExpensePieChart />
            </div>
          </div>
        </div>

        {/* Chi tiêu theo tuần */}
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
