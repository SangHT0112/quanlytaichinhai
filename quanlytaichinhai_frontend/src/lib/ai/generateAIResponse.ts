import { MessageContent } from "@/components/types"

export const generateAIResponse = (userMessage: string): MessageContent => {
  const lowerMessage = userMessage.toLowerCase().trim();

  if (/hello/i.test(lowerMessage)) {
    return [
      {
        type: 'text',
        text: 'Xin chào! Tôi là trợ lý tài chính của bạn 👋',
        style: 'default'
      }
    ]
  }

  if (/xem biểu đồ thu chi/i.test(lowerMessage)) {
    return [
      { type: "text", text: "📊 Dưới đây là biểu đồ thu chi:", style: "default" },
      {
        type: "component",
        name: "MonthlyBarChart",
        layout: "block",
        props: { initialMonths: 4 }
      }
    ]
  }
  if (/tổng quan về số dư/i.test(lowerMessage)) {
    return [
      {
        type: 'text',
        text: '📊 Tổng quan tài chính:',
        style: 'default',
      },
      {
        type: 'component',
        name: 'BalanceCardPage', // dùng cái này
        layout: 'block',
      },
      {
        type: 'text',
        text: 'Bạn cần phân tích thêm về khoản nào?',
        style: 'default',
      }
    ]
  }

  if (/Các danh mục chi tiêu nhiều/i.test(lowerMessage)) {
    return [
      {
        type: 'text',
        text: '📊 Tổng quan tài chính:',
        style: 'default',
      },
      {
        type: 'component',
        name: 'TopExpenseCategories',
        layout: 'block',
      },
      {
        type: 'text',
        text: 'Bạn có muốn xem cụ thể của tháng nào không?',
        style: 'default',
      }
    ]
  }

  if(/Xem chi tiêu trong tuần này/i.test(lowerMessage)){
    return[
      {
        type: 'text',
        text: 'Chi tieu trong tuan qua:',
        style: 'default'
      },
      {
        type: 'component',
        name: 'WeeklyBarChart',
        layout: 'block',
      }
    ]
  }

  if(/Xác nhận/i.test(lowerMessage)){
    return[
      {
        type: 'text',
        text: 'Xac nhan lai dum tui:',
        style: 'default'
      },
      {
        type: 'component',
        name: 'TransactionConfirmationForm',
        layout: 'block',
      }
    ]
  }


  return [
    {
      type: 'text',
      text: '🤖 Tôi có thể giúp bạn theo dõi chi tiêu, tiết kiệm và lập kế hoạch tài chính.',
      style: 'default'
    }
  ]


}
