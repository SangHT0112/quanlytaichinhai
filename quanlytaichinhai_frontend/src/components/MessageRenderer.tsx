'use client';
import React from 'react';
import { MessageContentPart, AllowedComponents, TransactionData, MessageRole } from '../utils/types';
import BalanceCardPage from '@/app/tongquan/components/BalanceCard';
import TopExpenseCategories from '@/app/tongquan/components/TopExpenseCategories';
import TransactionList from '@/app/tongquan/components/TransactionList';
import MonthlyBarChart from '@/app/thongke/components/MonthlyBarChart';
import WeeklyBarChart from '@/app/tongquan/components/WeeklyBarChart';
import TransactionConfirmationForm from './transaction-form/SingleTransactionConfirmationForm';
import CategoryDetailList from '@/app/thongke/components/CategoryDetailList';
import ExpensePieChart from '@/app/thongke/components/ExpensePieChart';
import DailySpendingAreaChart from '@/app/thongke/components/DailySpendingAreaChart';

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
  timeRange?: 'month' | 'year'; // Mặc định month
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
  role?: MessageRole;  // Thêm prop role để phân biệt
}

// Helper function để parse markdown thủ công (chỉ áp dụng cho assistant)
// Helper function để parse markdown thủ công (chỉ áp dụng cho assistant) - Updated cho list đẹp hơn
const parseMarkdown = (text: string): string => {
  let parsed = text;

  // Highlight từ khóa cụ thể (ví dụ: "tổng số tiền" xanh lá, "giao dịch" cam)
  parsed = parsed.replace(/\btổng số tiền\b/gi, '<span class="text-green-600 font-semibold">tổng số tiền</span>');
  parsed = parsed.replace(/\bgiao dịch\b/gi, '<span class="text-red-600 font-semibold">giao dịch</span>');

  // Bold: **text** → <strong class="text-blue-600 font-bold">text</strong>
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600 font-bold">$1</strong>');

  // Lists trước: Xử lý * Item hoặc - Item thành <ul><li class="ml-6 list-disc text-gray-800 py-1 border-l-2 border-green-200 pl-3">Item</li></ul> (đẹp hơn: indented, disc bullet, py-1 space, border-left green cho highlight)
  const lines = parsed.split('\n');
  let inList = false;
  let listItems = '';
  parsed = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      inList = true;
      const itemText = line.substring(2).trim();  // Remove * or - 
      // Parse italic/bold trong item nếu có (ưu tiên sau list match)
      const processedItem = itemText
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600 font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-gray-600 italic">$1</em>');
      listItems += `<li class="ml-6 list-disc text-gray-800 py-1 border-l-2 border-green-200 pl-3">${processedItem}</li>\n`;
      return '';  // Không return line, sẽ wrap sau
    } else {
      if (inList && listItems) {
        inList = false;
        const ul = `<ul class="space-y-0.5 mb-3 bg-gray-50 rounded-lg p-2">${listItems}</ul>`;
        listItems = '';  // Reset
        return ul + '\n' + line;
      }
      return line;
    }
  }).join('\n');

  // Nếu còn list chưa wrap (end of text)
  if (inList && listItems) {
    parsed = parsed + `<ul class="space-y-0.5 mb-3 bg-gray-50 rounded-lg p-2">${listItems}</ul>`;
  }

  // Italic: *text* → <em class="text-gray-600 italic">text</em> (sau list để không conflict)
  parsed = parsed.replace(/\*(.*?)\*/g, '<em class="text-gray-600 italic">$1</em>');

  // Headers: # H1 → <h1 class="text-xl font-bold text-slate-900 mb-2 bg-blue-50 p-2 rounded">H1</h1> (thêm bg/padded cho đẹp)
  parsed = parsed.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-slate-800 mb-1 bg-blue-50 p-2 rounded">$1</h3>');
  parsed = parsed.replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-slate-800 mb-1 bg-blue-50 p-2 rounded">$1</h2>');
  parsed = parsed.replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-slate-900 mb-2 bg-blue-50 p-2 rounded">$1</h1>');

  // Paragraphs: Wrap text blocks thành <p class="text-gray-700 leading-relaxed mb-2">
  // Chỉ wrap lines không phải HTML tags
  parsed = parsed.replace(/^(?!(<ul|<h|<li|<p)).*$/gm, '<p class="text-gray-700 leading-relaxed mb-2">$&</p>');

  // Clean code blocks nếu có (remove ```json/sql)
  parsed = parsed.replace(/```(?:json|sql)\s*[\s\S]*?```/g, '');

  return parsed;
};
export const MessageRenderer = ({ content, className = '', role }: MessageRendererProps) => {
  const renderText = (text: string) => {
    if (role === 'assistant') {
      // Chỉ parse markdown cho assistant
      const markdownHtml = parseMarkdown(text);
      return (
        <div 
          className={`text-current ${className}`}
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
        />
      );
    } else {
      // Giữ nguyên text thuần cho user
      return (
        <div className={`text-current whitespace-pre-wrap ${className}`}>
          {text}
        </div>
      );
    }
  };

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      
      // Nếu parse thành công, kiểm tra xem JSON có chứa text/content hợp lệ không
      if (typeof parsed === 'object' && parsed !== null) {
        const textFields = ['text', 'content', 'message'];
        const extractText = textFields.reduce((acc, field) => {
          return acc || (typeof parsed[field] === 'string' ? parsed[field] : null);
        }, null as string | null);
        
        if (extractText) {
          return renderText(extractText);
        } else {
          // JSON không có text hợp lệ → fallback placeholder
          return (
            <div className={`text-current whitespace-pre-wrap ${className}`}>
              Thông tin đang được xử lý...
            </div>
          );
        }
      } else {
        // JSON không phải object → fallback
        return renderText(content);
      }
    } catch {
      // Không phải JSON → render text
      return renderText(content);
    }
  }

  // Xử lý array/single part (giữ nguyên logic cũ cho custom_content/structured)
  // Áp dụng markdown cho text parts nếu role='assistant'
  const parts = Array.isArray(content) ? content : [content];

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          let textClass = 'text-current whitespace-pre-wrap';
          if (part.style === 'important') textClass = 'text-yellow-400 font-semibold';
          if (part.style === 'warning') textClass = 'text-red-500 font-semibold';

          // Parse markdown cho text part nếu role='assistant'
          if (role === 'assistant') {
            const markdownHtml = parseMarkdown(part.text);
            return (
              <div 
                key={`text-${index}`} 
                className={textClass}
                dangerouslySetInnerHTML={{ __html: markdownHtml }}
              />
            );
          } else {
            // Giữ nguyên cho user
            return (
              <p key={`text-${index}`} className={textClass}>
                {part.text}
              </p>
            );
          }
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

          // Kiểm tra nếu là chart component, thêm class để rộng hơn và margin bottom cho labels
          const isChartComponent = ['WeeklyBarChart', 'MonthlyBarChart', 'DailySpendingAreaChart', 'ExpensePieChart'].includes(componentName);
          const layoutClass =
            part.type === 'component' && part.layout === 'inline'
              ? 'inline-block mr-2'
              : isChartComponent 
                ? 'block w-full my-4 overflow-x-auto'  // w-full + overflow-x-auto để scroll nếu cần, my-4 cho space
                : 'block w-full my-2';

          // Nếu là chart, pass thêm prop để adjust chart (nếu component hỗ trợ)
          const chartProps = isChartComponent ? { ...props, chartMarginBottom: 60 } : props;  // Giả sử chart nhận prop này để tăng margin bottom

          return (
            <div key={`component-${index}`} className={layoutClass}>
              <Component {...chartProps} />
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