import { StructuredData } from '@/utils/types';

export const isConfirmPriorityStructured = (
  data: StructuredData | undefined
): data is Extract<StructuredData, { response_type: 'confirm_priority' }> => {
  if (!data || typeof data === 'string') {
    return false;
  }
  return (
    'response_type' in data &&
    data.response_type === 'confirm_priority' &&
    'temp_plans' in data &&
    Array.isArray(data.temp_plans) &&
    'priority_options' in data &&
    Array.isArray(data.priority_options) &&
    'message' in data &&
    typeof data.message === 'string'
  );
};

export const isSuggestNewCategoryStructured = (
  data: StructuredData | undefined
): data is Extract<StructuredData, { response_type: 'suggest_new_category' }> => {
  if (!data || typeof data === 'string') return false;
  return (
    'response_type' in data &&
    data.response_type === 'suggest_new_category' &&
    'temporary_transaction' in data &&
    Array.isArray(data.temporary_transaction?.transactions)
  );
};

export const isTransactionStructuredData = (
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
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('Lỗi parse structured data:', e, { data });
      return false;
    }
  }
  if (parsedData && typeof parsedData === 'object' && 'message' in parsedData && !('type' in parsedData)) {
    return false;
  }
  return !('type' in parsedData) || parsedData.type !== 'component';
};

