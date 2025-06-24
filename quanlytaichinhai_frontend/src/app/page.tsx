import ExpensePieChart from "@/components/charts/ExpensePieChart"
import WeeklyBarChart from "@/components/charts/WeeklyBarChart"
export default function Home(){
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

        {/* Thống kê danh mục và biểu đồ (placeholder) */}
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

        {/* Chi tiêu theo tuần (placeholder) */}
        <div className="bg-zinc-800 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Chi tiêu trong tuần</h3>
         <div className="h-40">
          <WeeklyBarChart />
        </div>

        </div>
      </main>
    </div>
  );
}