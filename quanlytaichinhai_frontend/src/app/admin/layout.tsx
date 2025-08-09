"use client";

import Link from "next/link";
import styles from "@/styles/admin.module.css";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [authorized, setAuthorized] = useState<boolean | null>(null); // null = chưa check

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      router.replace("/");
      return;
    }
    setAuthorized(true);
    document.body.classList.add("admin-body");
    return () => {
      document.body.classList.remove("admin-body");
    };
  }, [router]);

  if (authorized === null) {
    // Chưa biết có quyền hay không thì không render gì cả hoặc hiển thị loading
    return null; // hoặc <div>Loading...</div>
  }

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

      <main className={styles.adminContent}>{children}</main>
    </div>
  );
}
