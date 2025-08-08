"use client";

import Link from "next/link";
import styles from "@/styles/admin.module.css";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Thêm class admin-body để CSS riêng
    document.body.classList.add("admin-body");

    // Xóa khi thoát layout admin
    return () => {
      document.body.classList.remove("admin-body");
    };
  }, []);

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.info}>
          <Link href="/">
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={80}
            height={80}
            className="w-20 h-20"
          />

          </Link>
          <h2>Trang Quản Lý</h2>
        </div>
        <ul>
          <li className={pathname === "/admin/users" ? styles.active : ""}>
            <Link href="/admin/users">
              <i className="fa-solid fa-users"></i> Quản lý người dùng
            </Link>
          </li>
          <li className={pathname === "/admin/transactions" ? styles.active : ""}>
            <Link href="/admin/transactions">
              <i className="fa-solid fa-receipt"></i> Lịch sử giao dịch
            </Link>
          </li>
        </ul>
      </aside>

      <main className={styles.adminContent}>
        {children}
      </main>
    </div>
  );
}
