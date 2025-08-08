'use client';
import React from 'react';
import { MessageContentPart, AllowedComponents, TransactionData } from '../utils/types';
import BalanceCardPage from '@/app/tongquan/components/BalanceCard';
import TopExpenseCategories from '@/app/tongquan/components/TopExpenseCategories';
import TransactionList from '@/app/tongquan/components/TransactionList';
import MonthlyBarChart from '@/app/thongke/MonthlyBarChart';
import WeeklyBarChart from '@/app/tongquan/components/WeeklyBarChart';
import TransactionConfirmationForm from './transaction-form/SingleTransactionConfirmationForm';
import CategoryDetailList from '@/app/thongke/CategoryDetailList';
import ExpensePieChart from '@/app/thongke/ExpensePieChart';
import DailySpendingAreaChart from '@/app/thongke/DailySpendingAreaChart';

// Định nghĩa interface cho props của từng component
interface BalanceCardPageProps {
  balance?: number;
  currency?: string;
}

interface TopExpenseCategoriesProps {
  categories?: { name: string; amount: number }[];
  limit?: number;
}

interface TransactionListProps {
  dateFilter?: 'today' | 'yesterday' | string; // YYYY-MM-DD
  limit?: number; // Số giao dịch, mặc định 10
}

interface MonthlyBarChartProps {
  initialMonths?: number; // Số tháng, mặc định 1
}

interface WeeklyBarChartProps {
  initialWeeks?: number; // Số tuần, mặc định 1
}

interface CategoryDetailListProps {
  category?: string; // Tên danh mục
}

interface DailySpendingAreaChartProps {
  initialDays?: number; // Số ngày, mặc định 7
}

interface ExpensePieChartProps {
  timeRange?: 'month' | 'week' | 'year'; // Mặc định month
}

interface TransactionConfirmationFormProps {
  transactionType?: 'income' | 'expense';
  transactionData?: TransactionData | TransactionData[];
  isConfirmed?: boolean;
  onConfirm?: () => void;
  onEdit?: () => void;
}

// Định nghĩa union type cho tất cả các props
export type ComponentProps =
  | BalanceCardPageProps
  | TopExpenseCategoriesProps
  | TransactionListProps
  | MonthlyBarChartProps
  | WeeklyBarChartProps
  | CategoryDetailListProps
  | DailySpendingAreaChartProps
  | ExpensePieChartProps
  | TransactionConfirmationFormProps;

// Định nghĩa kiểu cho COMPONENT_MAP
type ComponentMap = {
  [key in AllowedComponents]: React.ComponentType<ComponentProps>;
};

const COMPONENT_MAP: ComponentMap = {
  BalanceCardPage: BalanceCardPage as React.ComponentType<ComponentProps>,
  TopExpenseCategories: TopExpenseCategories as React.ComponentType<ComponentProps>,
  TransactionList: TransactionList as React.ComponentType<ComponentProps>,
  MonthlyBarChart: MonthlyBarChart as React.ComponentType<ComponentProps>,
  WeeklyBarChart: WeeklyBarChart as React.ComponentType<ComponentProps>,
  CategoryDetailList: CategoryDetailList as React.ComponentType<ComponentProps>,
  DailySpendingAreaChart: DailySpendingAreaChart as React.ComponentType<ComponentProps>,
  ExpensePieChart: ExpensePieChart as React.ComponentType<ComponentProps>,
  TransactionConfirmationForm: TransactionConfirmationForm as React.ComponentType<ComponentProps>,
};

interface MessageRendererProps {
  content: string | MessageContentPart | MessageContentPart[];
  className?: string;
}

export const MessageRenderer = ({ content, className = '' }: MessageRendererProps) => {
  if (typeof content === 'string') {
    try {
      // Kiểm tra nếu content là JSON string, không hiển thị trực tiếp
      JSON.parse(content);
      return (
        <div className={`text-current whitespace-pre-wrap ${className}`}>
          {/* Hiển thị thông báo mặc định thay vì JSON thô */}
          Thông tin đang được xử lý...
        </div>
      );
    } catch {
      // Nếu không phải JSON, hiển thị như văn bản bình thường
      return (
        <div className={`text-current whitespace-pre-wrap ${className}`}>
          {content}
        </div>
      );
    }
  }

  const parts = Array.isArray(content) ? content : [content];

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          let textClass = 'text-current whitespace-pre-wrap';
          if (part.style === 'important') textClass = 'text-yellow-400 font-semibold';
          if (part.style === 'warning') textClass = 'text-red-500 font-semibold';

          return (
            <p key={`text-${index}`} className={textClass}>
              {part.text}
            </p>
          );
        }

        if (part.type === 'component' || part.type === 'function_call') {
          const componentName =
            part.type === 'component'
              ? part.name
              : part.name.replace(/^render_/, '');

          if (!COMPONENT_MAP[componentName as AllowedComponents]) {
            console.error(`Component ${componentName} không tồn tại trong COMPONENT_MAP`);
            return (
              <div key={`error-${index}`} className="p-2 bg-red-100 text-red-800 rounded">
                Lỗi: Component <code>{componentName}</code> không khả dụng
              </div>
            );
          }

          const Component = COMPONENT_MAP[componentName as AllowedComponents];
          const props: ComponentProps =
            part.type === 'component'
              ? (part.props as ComponentProps) || {}
              : JSON.parse(part.arguments || '{}');

          const layoutClass =
            part.type === 'component' && part.layout === 'inline'
              ? 'inline-block mr-2'
              : 'block w-full my-2';

          return (
            <div key={`component-${index}`} className={layoutClass}>
              <Component {...props} />
            </div>
          );
        }

        return (
          <div key={`unknown-${index}`} className="p-2 bg-yellow-100 text-yellow-800 rounded">
            Định dạng nội dung không được hỗ trợ
          </div>
        );
      })}
    </div>
  );
};
