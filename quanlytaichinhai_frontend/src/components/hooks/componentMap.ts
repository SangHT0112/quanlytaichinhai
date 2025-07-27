// components/componentMap.ts
import MonthlyBarChart from '@/app/thongke/MonthlyBarChart'
import BalanceCardPage from '@/app/tongquan/components/BalanceCard'
import TopExpenseCategories from '@/app/tongquan/components/TopExpenseCategories'
import TransactionList from '@/app/tongquan/components/TransactionList'
import WeeklyBarChart from '@/app/tongquan/components/WeeklyBarChart'
import TransactionConfirmationForm from '../transaction-form/SingleTransactionConfirmationForm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentMap: Record<string, React.ComponentType<any>> = {
  MonthlyBarChart,
  BalanceCardPage,
  TopExpenseCategories,
  TransactionList,
  WeeklyBarChart,
  TransactionConfirmationForm,
}
