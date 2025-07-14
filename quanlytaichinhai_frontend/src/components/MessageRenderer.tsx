'use client';
import React from 'react';
import { MessageContentPart, AllowedComponents } from './types';
import BalanceCardPage from '@/app/tongquan/components/BalanceCard';
import TopExpenseCategories from '@/app/tongquan/components/TopExpenseCategories';
import TransactionList from '@/app/tongquan/components/TransactionList';
import MonthlyBarChart from '@/app/thongke/MonthlyBarChart';
import WeeklyBarChart from '@/app/tongquan/components/WeeklyBarChart';
import TransactionConfirmationForm from './transaction-form/SingleTransactionConfirmationForm';
// 1. Tạo bản đồ component với TypeScript type safety
const COMPONENT_MAP: Record<AllowedComponents, React.ComponentType<any>> = {
  BalanceCardPage: BalanceCardPage,
  TopExpenseCategories: TopExpenseCategories,
  TransactionList: TransactionList,
  MonthlyBarChart: MonthlyBarChart,
  WeeklyBarChart: WeeklyBarChart,
  TransactionConfirmationForm: TransactionConfirmationForm,
};

// 2. Kiểu props cho MessageRenderer
interface MessageRendererProps {
 content: string | MessageContentPart | MessageContentPart[]; 
  className?: string;
}

export const MessageRenderer = ({ content, className = '' }: MessageRendererProps) => {
  // 3. Xử lý trường hợp content là string
  if (typeof content === 'string') {
    return (
      <div className={`text-current whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    );
  }

  // 4. Chuẩn hóa content thành mảng
  const parts = Array.isArray(content) ? content : [content];

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((part, index) => {
        // 5. Xử lý phần text
        if (part.type === 'text') {
          let textClass = "text-current whitespace-pre-wrap";
          if (part.style === 'important') textClass = "text-yellow-400 font-semibold";
          if (part.style === 'warning') textClass = "text-red-500 font-semibold";

          return (
            <p key={`text-${index}`} className={textClass}>
              {part.text || part.text} {/* Hỗ trợ cả text và content cho tương thích ngược */}
            </p>
          );
        }

        // 6. Xử lý component/function call
        if (part.type === 'component' || part.type === 'function_call') {
            const componentName =
                part.type === 'component'
                ? part.name
                : part.name.replace(/^render_/, '');

            if (!COMPONENT_MAP[componentName as AllowedComponents]) {
                console.error(`Component ${componentName} không tồn tại trong COMPONENT_MAP`);
                return (
                <div key={`error-${index}`} className="p-2 bg-red-100 text-red-800 rounded">
                    Lỗi: Component "{componentName}" không khả dụng
                </div>
                );
            }

            const Component = COMPONENT_MAP[componentName as AllowedComponents];
            const props =
                part.type === 'component'
                ? part.props
                : JSON.parse(part.arguments);

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


        // 9. Fallback cho các trường hợp không xác định
        return (
          <div key={`unknown-${index}`} className="p-2 bg-yellow-100 text-yellow-800 rounded">
            Định dạng nội dung không được hỗ trợ
          </div>
        );
      })}
    </div>
  );
};