"use client"

import LoginRequiredModal from "@/components/Layouts/LoginRequiredModal"

interface Props {
  isLoggedIn: boolean
}

export default function OverviewSkeleton({ isLoggedIn }: Props) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 py-0 animate-pulse text-white">
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
