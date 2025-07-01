interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  icon?: string;
}

export const recentTransactions: Transaction[] = [
  {
    id: '1',
    date: '2023-11-15',
    amount: 1500000,
    type: 'income',
    category: 'Lương tháng',
    description: 'Lương tháng 11 từ công ty ABC',
    icon: '💰'
  },
  {
    id: '2',
    date: '2023-11-14',
    amount: 320000,
    type: 'expense',
    category: 'Ăn uống',
    description: 'Tiệc sinh nhật bạn thân',
    icon: '🍔'
  },
  {
    id: '3',
    date: '2023-11-13',
    amount: 2500000,
    type: 'income',
    category: 'Freelance',
    description: 'Dự án thiết kế website',
    icon: '💻'
  },
  {
    id: '4',
    date: '2023-11-12',
    amount: 120000,
    type: 'expense',
    category: 'Di chuyển',
    description: 'Đổ xăng xe máy',
    icon: '⛽'
  },
  {
    id: '5',
    date: '2023-11-11',
    amount: 450000,
    type: 'expense',
    category: 'Mua sắm',
    description: 'Quần áo mùa đông',
    icon: '🛍️'
  }
];