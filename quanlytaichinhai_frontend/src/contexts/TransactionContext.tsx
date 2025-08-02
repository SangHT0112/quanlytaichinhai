"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import axiosInstance from "@/config/axios";

// Định nghĩa kiểu dữ liệu giao dịch
interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "income" | "expense";
  time: string;
  category?: string;
  group_id?: number;
}

interface TransactionGroup {
  group_id: number;
  group_name: string;
  total_amount: number;
  transaction_date: string;
  created_at: string;
}

// Kiểu dữ liệu cho response từ API
interface ApiTransactionResponse {
  id: number;
  description: string;
  amount: number;
  type: "income" | "expense";
  created_at: string;
  category?: string;
  group_id?: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  transactionGroups?: TransactionGroup[];
  refreshTransactions: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  setTransactions: (tx: Transaction[]) => void;
  error: string | null;
  loading: boolean;
}

export const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  refreshTransactions: async () => {},
  loadMoreTransactions: async () => {},
  setTransactions: () => {},
  error: null,
  loading: false,
});

interface Props {
  children: ReactNode;
  user: { user_id: number } | null;
}

export const TransactionProvider = ({ children, user }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const limit = 5;

  const mapApiResponseToTransaction = (data: ApiTransactionResponse[]): Transaction[] => {
    return data.map((row) => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      type: row.type,
      time: row.created_at,
      category: row.category,
      group_id: row.group_id,
    }));
  };

  const refreshTransactions = useCallback(async () => {
    if (!user?.user_id) {
      setError("Không tìm thấy user ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await axiosInstance.get<ApiTransactionResponse[]>("/transactions/recent", {
        params: {
          user_id: user.user_id,
          limit,
          offset: 0,
        },
      });

      setTransactions(mapApiResponseToTransaction(res.data));
      setOffset(0);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Lỗi khi fetch giao dịch:", err.message);
      setError("Không thể tải giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadMoreTransactions = useCallback(async () => {
    if (!user?.user_id) {
      setError("Không tìm thấy user ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await axiosInstance.get<ApiTransactionResponse[]>("/transactions/recent", {
        params: {
          user_id: user.user_id,
          limit,
          offset: offset + limit,
        },
      });

      setTransactions(prev => [...prev, ...mapApiResponseToTransaction(res.data)]);
      setOffset(prev => prev + limit);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Lỗi khi fetch thêm giao dịch:", err.message);
      setError("Không thể tải thêm giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, offset]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        refreshTransactions,
        loadMoreTransactions,
        setTransactions,
        error,
        loading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);