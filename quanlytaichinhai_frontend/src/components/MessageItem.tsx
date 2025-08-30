'use client';
import { useState, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import type { ChatMessage, StructuredData, TransactionData } from '../utils/types';
import { MessageRenderer } from './MessageRenderer';
import SingleTransactionConfirmationForm from './transaction-form/SingleTransactionConfirmationForm';
import MultiTransactionConfirmationForm from './transaction-form/MultiTransactionConfirmationForm';
import TransactionEditForm from './transaction-form/TransactionEditForm';
import { renderCustomContent } from './hooks/renderCustomContent';
import BackgroundImageConfirmForm from './transaction-form/ComfirmImage';
import CategoryConfirmationForm from './transaction-form/CategoryConfirmationForm';

const isTransactionStructuredData = (
  data: StructuredData,
): data is {
  transactions?: Array<{
    type: 'expense' | 'income';
    category: string;
    amount: number;
    user_id?: number;
    date?: string;
    transaction_date?: string;
    description?: string;
  }>;
  group_name?: string;
  total_amount?: number;
  transaction_date?: string;
} => {
  // Xử lý trường hợp data là chuỗi JSON
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('Lỗi parse structured data:', e, { data });
      return false;
    }
  }
  // Xử lý trường hợp parsedData là { message: string }
  if (parsedData && typeof parsedData === 'object' && 'message' in parsedData && !('type' in parsedData)) {
    return false; // Không phải dữ liệu giao dịch
  }
  return !('type' in parsedData) || parsedData.type !== 'component';
};

const isSuggestNewCategory = (
  data: StructuredData | undefined,
): data is Extract<StructuredData, { response_type: 'suggest_new_category' }> => {
  if (!data) return false;
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('Lỗi parse structured data for category:', e, { data });
      return false;
    }
  }
  return (
    typeof (parsedData as { response_type?: string }).response_type === 'string' &&
    (parsedData as { response_type?: string }).response_type === 'suggest_new_category'
  );
};

function hasImageUrl(data: StructuredData): data is {
  transactions?: Array<{
    type: 'expense' | 'income';
    amount: number;
    category: string;
    date?: string;
    user_id?: number;
    description?: string;
    transaction_date?: string;
  }>;
  group_name?: string;
  total_amount?: number;
  transaction_date?: string;
  image_url?: string;
} {
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('Lỗi parse structured data for image:', e, { data });
      return false;
    }
  }
  return 'image_url' in parsedData;
}

export const MessageItem = ({
  message,
  onConfirm,
  confirmedIds = [],
  onSaveEdit,
}: {
  message: ChatMessage;
  onConfirm?: (message: ChatMessage, correctedData?: TransactionData | TransactionData[]) => Promise<void>;
  confirmedIds?: string[];
  onSaveEdit?: (messageId: string, editedData: TransactionData, editingIndex: number) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const groupTransactionDate = (message.structured as { transaction_date?: string })?.transaction_date;

  const [pendingTransaction, setPendingTransaction] = useState<TransactionData | null>(null);
  const [isCategoryConfirmed, setIsCategoryConfirmed] = useState(confirmedIds.includes(message.id));
  const [isTransactionConfirmed, setIsTransactionConfirmed] = useState(confirmedIds.includes(message.id));

  useEffect(() => {
    const storedPending = localStorage.getItem(`pendingTransaction_${message.id}`);
    if (storedPending) {
      setPendingTransaction(JSON.parse(storedPending));
    }
  }, [message.id]);

  const transactions: TransactionData[] =
    message.structured &&
    isTransactionStructuredData(message.structured) &&
    Array.isArray((typeof message.structured === 'string' ? JSON.parse(message.structured) : message.structured).transactions)
      ? (typeof message.structured === 'string' ? JSON.parse(message.structured) : message.structured).transactions.map((tx) => ({
          type: tx.type || 'expense',
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          user_id: tx.user_id ?? 1,
          description: tx.description || message.user_input || message.content || 'Không có mô tả',
          transaction_date: tx.transaction_date || groupTransactionDate || new Date().toISOString(),
        }))
      : [];

  const defaultTransaction: TransactionData = transactions[editingIndex] || {
    type: 'expense',
    amount: 0,
    category: '',
    user_id: 1,
    date: new Date().toISOString(),
    description: message.user_input || message.content || 'Không có mô tả',
    transaction_date: new Date().toISOString(),
  };

  const [editedData, setEditedData] = useState<TransactionData>({
    ...defaultTransaction,
  });

  const isTransaction = transactions.length > 0;
  const isSingleTransaction = transactions.length === 1;
  const isMultiTransaction = transactions.length > 1;
  const hasCustomContent =
    Array.isArray(message.custom_content) &&
    message.custom_content.some((part) => part.type === 'component' || part.type === 'function_call');

  const handleEditChange = (field: keyof TransactionData, value: string | number) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
      user_id: prev.user_id ?? 1,
      description: field === 'description' ? (value as string) : prev.description,
      transaction_date: field === 'date' ? (value as string) : prev.transaction_date,
    }));
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      await onSaveEdit?.(message.id, editedData, editingIndex);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedData({
      ...(transactions[editingIndex] || defaultTransaction),
    });
    setIsEditing(false);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditedData({
      ...transactions[index],
    });
    setIsEditing(true);
  };

  const handleConfirmAll = async () => {
    setIsLoading(true);
    try {
      if (onConfirm) {
        await onConfirm(message, transactions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryConfirm = async (confirmed: boolean, transactionData?: TransactionData) => {
    if (confirmed) {
      setIsCategoryConfirmed(true);
      if (transactionData) {
        setPendingTransaction(transactionData);
        localStorage.setItem(`pendingTransaction_${message.id}`, JSON.stringify(transactionData));
      } else {
        await onConfirm?.(message);
      }
    } else {
      setIsCategoryConfirmed(false);
      setPendingTransaction(null);
      localStorage.removeItem(`pendingTransaction_${message.id}`);
    }
  };

  const handleTransactionConfirm = async (transactionData: TransactionData) => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm(message, transactionData);
        setIsTransactionConfirmed(true);
        localStorage.removeItem(`pendingTransaction_${message.id}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`flex w-full mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`
          flex flex-col
          max-w-[80%] sm:max-w-[70%] md:max-w-[60%]
          min-w-[120px]
          rounded-2xl px-4 py-3
          break-words
          ${message.role === 'user'
            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-none'
            : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}
          ${hasCustomContent ? '!min-w-[300px]' : ''}
        `}
      >
        {!isTransaction && !hasCustomContent && message.content && (
          <div className="mt-2">
            <MessageRenderer content={message.content} />
          </div>
        )}

        {isTransaction && (
          <div className="mt-2">
            {isEditing ? (
              <TransactionEditForm
                initialData={editedData}
                onChange={handleEditChange}
                onCancel={handleCancelEdit}
                onSave={handleSaveEdit}
                isLoading={isLoading}
              />
            ) : (
              <>
                {isSingleTransaction && (
                  <SingleTransactionConfirmationForm
                    transactionData={transactions[0]}
                    isConfirmed={isTransactionConfirmed || confirmedIds.includes(message.id)}
                    onConfirm={() => onConfirm?.(message, transactions[0])}
                    onEdit={() => handleStartEdit(0)}
                  />
                )}
                {isMultiTransaction && message.structured && isTransactionStructuredData(message.structured) && (
                  <MultiTransactionConfirmationForm
                    groupName={message.structured.group_name || ''}
                    transactionDate={message.structured.transaction_date || new Date().toISOString()}
                    transactions={transactions}
                    totalAmount={message.structured.total_amount || 0}
                    isConfirmed={confirmedIds.includes(message.id)}
                    onConfirmAll={handleConfirmAll}
                    onEdit={handleStartEdit}
                  />
                )}
              </>
            )}
          </div>
        )}

        {message.structured && isSuggestNewCategory(message.structured) && (
          <div className="mt-2">
            <CategoryConfirmationForm
              categoryData={message.structured.suggest_new_category}
              user_id={message.structured.temporary_transaction?.user_id ?? 1}
              messageId={message.id}
              onConfirm={handleCategoryConfirm}
              temporary_transaction={message.structured.temporary_transaction}
              isConfirmed={isCategoryConfirmed}
            />
          </div>
        )}

        {pendingTransaction && (
          <div className="mt-2">
            <SingleTransactionConfirmationForm
              transactionData={pendingTransaction}
              isConfirmed={isTransactionConfirmed || confirmedIds.includes(message.id)}
              onConfirm={() => handleTransactionConfirm(pendingTransaction)}
              onEdit={() => {
                setEditedData(pendingTransaction);
                setIsEditing(true);
              }}
            />
          </div>
        )}

        {message.structured &&
          hasImageUrl(message.structured) &&
          typeof message.structured.image_url === 'string' && (
            <BackgroundImageConfirmForm imageUrl={message.structured.image_url} />
          )}

        {message.custom_content?.map((part, index) => (
          <div key={index} className="mt-2">
            {renderCustomContent(part)}
          </div>
        ))}

        <div
          className={`text-xs mt-2 opacity-70 ${message.role === 'user' ? 'text-teal-100' : 'text-slate-500'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      {message.role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center ml-2">
          <User className="w-5 h-5 text-slate-600" />
        </div>
      )}
    </div>
  );
};