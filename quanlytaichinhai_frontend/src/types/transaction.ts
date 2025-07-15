// src/types/transaction.ts
export interface TransactionData {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  date?: string;
  user_id: number;
  description: string;
  transaction_date: string;
}

export interface Transaction {
  group_id: number
  group_name: string
  transaction_date: string
  total_amount: string | number
  transaction_count: number
}

export interface TransactionDetail {
  transaction_id: number
  description: string
  category_name: string
  transaction_date: string
  amount: string | number
  type: "income" | "expense"
}