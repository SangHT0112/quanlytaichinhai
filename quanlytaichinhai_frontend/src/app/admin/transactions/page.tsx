"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: number;
  user: string;
  amount: number;
  type: string;
  date: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Gọi API lấy danh sách giao dịch
    fetch("/api/admin/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data));
  }, []);

  return (
    <div>
      <h1>Lịch sử giao dịch</h1>
      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Người dùng</th>
            <th>Số tiền</th>
            <th>Loại</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? transactions.map(tx => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.user}</td>
              <td>{tx.amount.toLocaleString()} đ</td>
              <td>{tx.type}</td>
              <td>{new Date(tx.date).toLocaleDateString()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5}>Không có dữ liệu</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
