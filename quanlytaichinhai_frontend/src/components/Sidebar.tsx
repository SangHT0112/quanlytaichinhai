'use client'; // nếu bạn cần state hoặc xử lý client-side

import Link from 'next/link';

export default function Sidebar() {
    const handleLinkClick = (href: string) => {
      localStorage.setItem('redirectAfterLogin', href)
    }
  return (
    <aside className="w-64 bg-zinc-900 p-4 space-y-6 sticky top-0 h-screen">
      <h2 className="text-xl font-bold">AI Finance</h2>
      <nav className="space-y-2 text-sm">
        <Link href="/" onClick={() => handleLinkClick('/')}>
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">➕ Thêm giao dịch</div>
        </Link>
        <Link href="/tongquan" onClick={() => handleLinkClick('/tongquan')}>
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">📊 Tổng quan</div>
        </Link>
        <Link href="/financial_plan" onClick={() => handleLinkClick('/financial_plan')}>
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">📋  Lập kế hoạch tài chính</div>
        </Link>
        <Link href="/history" onClick={() => handleLinkClick('/history')}>
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">📜 Lịch sử</div>
        </Link>
        <Link href="/thongke" onClick={() => handleLinkClick('/thongke')}>
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">📈 Thống kê</div>
        </Link>
        <Link href="/chatai" onClick={() => handleLinkClick('/chatai')}>
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">🤖 Gợi ý AI</div>
        </Link>
        <Link href="/settings">
          <div className="hover:bg-zinc-800 p-2 rounded cursor-pointer">⚙️ Cài đặt</div>
        </Link>
      </nav>
    </aside>
  );
}
