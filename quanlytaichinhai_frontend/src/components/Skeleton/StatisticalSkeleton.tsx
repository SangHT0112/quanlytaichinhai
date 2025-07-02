"use client"

export default function StatisticalSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white p-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {Array(3).fill(0).map((_, idx) => (
          <div key={idx} className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <div className="h-4 bg-gray-700 w-1/3 rounded" />
            <div className="h-6 bg-gray-600 w-2/3 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-zinc-800 rounded-lg p-4 space-y-2 h-20 mb-4" />
      {Array(5).fill(0).map((_, idx) => (
        <div key={idx} className="bg-zinc-800 rounded-lg p-4 h-16 mb-2" />
      ))}
    </div>
  )
}