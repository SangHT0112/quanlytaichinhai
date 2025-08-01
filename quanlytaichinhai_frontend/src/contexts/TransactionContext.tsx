"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "@/config/axios";

// Định nghĩa kiểu dữ liệu giao dịch
interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "income" | "expense";
  time: string;
}
interface TransactionGroup {
  group_id: number;
  group_name: string;
  total_amount: number;
  transaction_date: string;
}

// Kiểu dữ liệu cho context
interface TransactionContextType {
  transactions: Transaction[];
  refreshTransactions: () => Promise<void>;
  setTransactions: (tx: Transaction[]) => void;
}

export const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  refreshTransactions: async () => {},
  setTransactions: () => {},
});

interface Props {
  children: ReactNode;
  user: { user_id: number } | null;
}

export const TransactionProvider = ({ children, user }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshTransactions = async () => {
    if (!user?.user_id) return;

    try {
      const res = await axiosInstance.get("/transactions/groups", {
        params: {
          user_id: user.user_id,
          date: "today",
        },
      });

      const mapped: Transaction[] = res.data.map((group: TransactionGroup) => ({
        id: group.group_id,
        description: group.group_name,
        amount: group.total_amount,
        type: group.total_amount >= 0 ? "income" : "expense",
        time: new Date(group.transaction_date).toLocaleDateString("vi-VN"),
      }));

      setTransactions(mapped);
    } catch (error) {
      console.error("❌ Lỗi khi fetch giao dịch:", error);
    }
  };

  useEffect(() => {
    refreshTransactions();
  }, [user?.user_id]);

  return (
    <TransactionContext.Provider value={{ transactions, refreshTransactions, setTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);
