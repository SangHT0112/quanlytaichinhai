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
  category_name?: string;
  category_icon?: string;
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
  selectedGroupTransactions: Transaction[];
  refreshTransactionGroups: () => Promise<void>;
  loadMoreTransactionGroups: () => Promise<void>;
  fetchGroupTransactions: (groupId: number) => Promise<void>;
  setTransactionGroups: (groups: TransactionGroup[]) => void;
  error: string | null;
  loading: boolean;
}

export const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  transactionGroups: [],
  selectedGroupTransactions: [],
  refreshTransactionGroups: async () => {},
  loadMoreTransactionGroups: async () => {},
  fetchGroupTransactions: async () => {},
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
  const [selectedGroupTransactions, setSelectedGroupTransactions] = useState<Transaction[]>([]);
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

  const removeDuplicates = (groups: TransactionGroup[]): TransactionGroup[] => {
    const seen = new Set<number>();
    return groups.filter((group) => {
      if (seen.has(group.group_id)) {
        console.warn(`Duplicate group_id found: ${group.group_id}`);
        return false;
      }
      seen.add(group.group_id);
      return true;
    });
  };

  const refreshTransactionGroups = useCallback(async () => {
    if (!user?.user_id) {
      setError("Không tìm thấy user ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Refreshing groups with offset: 0");
      const res = await axiosInstance.get<ApiTransactionGroupResponse[]>("/transactions/groups", {
        params: {
          user_id: user.user_id,
          limit,
          offset: 0,
        },
      });

      const uniqueGroups = removeDuplicates(mapApiResponseToTransactionGroup(res.data));
      setTransactionGroups(uniqueGroups);
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

      const currentOffset = offset + limit;
      console.log("Fetching more groups with offset:", currentOffset);
      const res = await axiosInstance.get<ApiTransactionGroupResponse[]>("/transactions/groups", {
        params: {
          user_id: user.user_id,
          limit,
          offset: currentOffset,
        },
      });

      console.log("Received groups:", res.data);
      if (res.data.length === 0) {
        setError("Không còn nhóm giao dịch để tải.");
        return;
      }

      const uniqueGroups = removeDuplicates(mapApiResponseToTransactionGroup(res.data));
      setTransactionGroups((prev) => removeDuplicates([...prev, ...uniqueGroups]));
      setOffset(currentOffset);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Lỗi khi fetch thêm nhóm giao dịch:", err.message);
      setError("Không thể tải thêm nhóm giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, offset]);

  const fetchGroupTransactions = useCallback(async (groupId: number) => {
    if (!user?.user_id) {
      setError("Không tìm thấy user ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching transactions for group_id: ${groupId}`);
      const res = await axiosInstance.get<Transaction[]>(`/transactions/groups/${groupId}`);
      setSelectedGroupTransactions(res.data);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Lỗi khi fetch chi tiết giao dịch:", err.message);
      setError("Không thể tải chi tiết giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    refreshTransactionGroups();
  }, [refreshTransactionGroups]);

  return (
    <TransactionContext.Provider
      value={{
        transactions: [],
        transactionGroups,
        selectedGroupTransactions,
        refreshTransactionGroups,
        loadMoreTransactionGroups,
        fetchGroupTransactions,
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
