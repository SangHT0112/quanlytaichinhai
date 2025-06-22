export default function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-900 p-4 space-y-6 sticky top-0 h-screen">
      <h2 className="text-xl font-bold">AI Finance</h2>
      <nav className="space-y-2 text-sm">
        <div className="hover:bg-zinc-800 p-2 rounded">📊 Tổng quan</div>
        <div className="hover:bg-zinc-800 p-2 rounded">➕ Thêm giao dịch</div>
        <div className="hover:bg-zinc-800 p-2 rounded">📜 Lịch sử</div>
        <div className="hover:bg-zinc-800 p-2 rounded">📈 Thống kê</div>
        <div className="hover:bg-zinc-800 p-2 rounded">🤖 Gợi ý AI</div>
        <div className="hover:bg-zinc-800 p-2 rounded">⚙️ Cài đặt</div>
      </nav>
    </aside>
  );
}
