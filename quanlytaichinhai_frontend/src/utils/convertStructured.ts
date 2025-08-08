import { StructuredData, ChatMessage, AllowedComponents } from '@/utils/types';
// Helper: Type guard để kiểm tra StructuredData dạng component
const isComponentStructuredData = (data: StructuredData): data is { type: 'component'; name: AllowedComponents; introText?: string; props?: Record<string, unknown>; layout?: 'inline' | 'block' } => {
  return 'type' in data && data.type === 'component';
};




// Helper: Convert structured → custom_content
 export function convertStructuredToCustomContent(structured: StructuredData): ChatMessage['custom_content'] | undefined {
  if (isComponentStructuredData(structured)) {
    return [
      {
        type: 'text',
        text: structured.introText || 'Thông tin từ AI',
        style: 'default',
      },
      {
        type: 'component',
        name: structured.name,
        layout: structured.layout || 'block',
        props: structured.props || {},
      },
    ];
  } else if ('transactions' in structured && structured.transactions) {
    return [
      {
        type: 'text',
        text: structured.group_name || 'Thông tin giao dịch từ AI',
        style: 'default',
      },
      {
        type: 'component',
        name: 'TransactionConfirmationForm',
        layout: 'block',
        props: {
          transactionData: structured.transactions,
          transactionType: structured.transactions[0]?.type || 'expense',
        },
      },
    ];
  }
  return undefined;
}