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
  transaction_count: number;
}

// Kiểu dữ liệu cho response từ API
interface ApiTransactionGroupResponse {
  group_id: number;
  group_name: string;
  total_amount: number;
  transaction_date: string;
  created_at: string;
  transaction_count: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  transactionGroups: TransactionGroup[];
  refreshTransactionGroups: () => Promise<void>;
  loadMoreTransactionGroups: () => Promise<void>;
  setTransactionGroups: (groups: TransactionGroup[]) => void;
  error: string | null;
  loading: boolean;
}

export const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  transactionGroups: [],
  refreshTransactionGroups: async () => {},
  loadMoreTransactionGroups: async () => {},
  setTransactionGroups: () => {},
  error: null,
  loading: false,
});

interface Props {
  children: ReactNode;
  user: { user_id: number } | null;
}

export const TransactionProvider = ({ children, user }: Props) => {
  const [transactionGroups, setTransactionGroups] = useState<TransactionGroup[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const limit = 5;

  const mapApiResponseToTransactionGroup = (data: ApiTransactionGroupResponse[]): TransactionGroup[] => {
    return data.map((row) => ({
      group_id: row.group_id,
      group_name: row.group_name,
      total_amount: row.total_amount,
      transaction_date: row.transaction_date,
      created_at: row.created_at,
      transaction_count: row.transaction_count,
    }));
  };

  const refreshTransactionGroups = useCallback(async () => {
    if (!user?.user_id) {
      setError("Không tìm thấy user ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.get<ApiTransactionGroupResponse[]>("/transactions/groups", {
        params: {
          user_id: user.user_id,
          limit,
          offset: 0,
        },
      });

      setTransactionGroups(mapApiResponseToTransactionGroup(res.data));
      setOffset(0);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Lỗi khi fetch nhóm giao dịch:", err.message);
      setError("Không thể tải nhóm giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadMoreTransactionGroups = useCallback(async () => {
    if (!user?.user_id) {
      setError("Không tìm thấy user ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.get<ApiTransactionGroupResponse[]>("/transactions/groups", {
        params: {
          user_id: user.user_id,
          limit,
          offset: offset + limit,
        },
      });

      setTransactionGroups((prev) => [...prev, ...mapApiResponseToTransactionGroup(res.data)]);
      setOffset((prev) => prev + limit);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Lỗi khi fetch thêm nhóm giao dịch:", err.message);
      setError("Không thể tải thêm nhóm giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, offset]);

  useEffect(() => {
    refreshTransactionGroups();
  }, [refreshTransactionGroups]);

  return (
    <TransactionContext.Provider
      value={{
        transactions: [], // Giữ lại để tương thích, nhưng không sử dụng
        transactionGroups,
        refreshTransactionGroups,
        loadMoreTransactionGroups,
        setTransactionGroups,
        error,
        loading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);