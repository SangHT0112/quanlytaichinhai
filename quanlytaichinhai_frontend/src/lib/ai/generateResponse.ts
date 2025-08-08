
  import { MessageContent } from "@/utils/types"
  export const generateResponse = (userMessage: string): MessageContent => {
    const lowerMessage = userMessage.toLowerCase()
    // Danh sách từ khóa điều hướng (không phân biệt vị trí trong câu)
    const NAV_TRIGGERS = [
      'đến trang', 'vào trang','qua trang',
      'đưa tôi đến', 'đưa tôi tới', 'đi tới', 'đi đến',
      'tôi muốn vào', 'mở trang', 'chuyển tới', 'chuyển đến',
      'nhảy tới', 'hiển thị trang'
    ];

    // Kiểm tra có phải là yêu cầu điều hướng không
    const isNavigationRequest = NAV_TRIGGERS.some(trigger => 
      lowerMessage.includes(trigger)
    );

    

    // ======================= Xử lý yêu cầu điều hướng ==========================
    if (isNavigationRequest) {

      // 1.Lịch sử giao dịch
      if (/lịch sử|giao dịch gần đây|history/i.test(lowerMessage)) {
        window.postMessage({
          type: 'NAVIGATE',
          payload: { path: '/history', target: 'transactions-history' }
        }, '*');
        return "📜 Đang tải lịch sử giao dịch...";
      }

      // 2. Thống kê
      if (/thống kê|báo cáo|analytics|stats/i.test(lowerMessage)) {
        window.postMessage({
          type: 'NAVIGATE',
          payload: { path: '/thongke', target: 'stats-section' }
        }, '*');
        return "📈 Đang mở báo cáo thống kê...";
      }
    }


    // Xử lý tìm kiếm
     // Xử lý tìm kiếm với regex đồng bộ với aiFilterHelper
    const searchMatch = userMessage.match(/(?:tìm kiếm|tìm|search)\s*(?:giao dịch|transaction)?\s*(.+)/i);
    if (searchMatch) {
      const rawKeyword = searchMatch[1].trim();
      const cleanedKeyword = rawKeyword
        .replace(/giao dịch|transaction/gi, '')
        .trim();
      
      if (cleanedKeyword) {
        window.postMessage({
          type: 'SEARCH',
          payload: { keyword: cleanedKeyword }
        }, '*');
        
        if (!window.location.pathname.includes('/history')) {
          return `🔍 Đang chuyển đến trang lịch sử để tìm kiếm "${cleanedKeyword}"...`;
        }
        return `🔎 Đang tìm kiếm "${cleanedKeyword}"...`;
      }
      return "Vui lòng nhập từ khóa tìm kiếm. Ví dụ: \"Tìm kiếm Starbucks\"";
    }


    //===========================DÙNG FILTER ĐỂ LỌC==============================================================
          //Lọc chi tiêu hoặc giao dịch
    if (/lịch sử chi tiêu|giao dịch chi tiêu|lọc chi tiêu|xem chi tiêu|tiền ra|mua sắm|thanh toán/i.test(lowerMessage)) {
      window.postMessage({
        type: 'FILTER',
        payload: {
          message: 'lọc loại giao dịch chi tiêu' // hoặc: 'filter type=expense'
        }
      }, '*')

      if (!window.location.pathname.includes('/history')) {
        return "💸 Đang chuyển đến trang lịch sử giao dịch chi tiêu...";
      }

      return "🔍 Đang lọc các giao dịch chi tiêu...";
    }
    if (/lịch sử thu nhập|giao dịch thu nhập|lọc thu nhập|xem thu nhập/i.test(lowerMessage)) {
      window.postMessage({
        type: 'FILTER',
        payload: {
          message: 'lọc loại giao dịch thu nhập' // hoặc: 'filter type=expense'
        }
      }, '*')

      if (!window.location.pathname.includes('/history')) {
        return "💸 Đang chuyển đến trang lịch sử thu nhập...";
      }

      return "🔍 Đang lọc các giao dịch chi tiêu...";
    }


    // ===================Xử lý yêu cầu lọc lịch sử theo category=======================
    if (/lịch sử ăn uống|giao dịch ăn uống|chi tiêu ăn uống|đồ ăn|thức ăn/i.test(lowerMessage)) {
      // Gửi message đến trang history để áp dụng filter
      window.postMessage({
        type: 'FILTER',
        payload: {
          message: 'filter category=Ăn uống' // Đảm bảo khớp với category trong database
        }
      }, '*');

      // Nếu đang ở trang khác, thông báo sẽ chuyển trang
      if (!window.location.pathname.includes('/history')) {
        return "🍔 Đang chuyển đến trang lịch sử với các giao dịch ăn uống...";
      }
      
      return "🍽️ Đang lọc các giao dịch ăn uống...";
    }


    // ===================Xử lý yêu cầu lọc lịch sử theo tháng=======================
      const matchMonth = lowerMessage.match(/tháng\s*(\d{1,2})/);
      if (matchMonth) {
        const rawMonth = matchMonth[1];
        const month = rawMonth.padStart(2, '0'); // "6" → "06", "11" → "11"

        // Gửi message đến trang history
        window.postMessage({
          type: 'FILTER',
          payload: {
            message: `lọc giao dịch tháng ${parseInt(month)}`
          }
        }, '*');

        if (!window.location.pathname.includes('/history')) {
          return `🗓️ Đang chuyển đến lịch sử giao dịch tháng ${parseInt(month)}...`;
        }

        return `🔎 Đang lọc các giao dịch trong tháng ${parseInt(month)}...`;
      }



    // ===============Xử lý hỏi đáp thông thường (không chứa từ khóa điều hướng =======================
       // Xử lý các trường hợp trả về text đơn giản
        if (/chi tiêu tháng này|spending/i.test(lowerMessage)) {
            return { 
            type: 'text', 
            text: '💸 Tháng này bạn đã chi tiêu 4.200.000 ₫',
            style: 'important'
            };
        }
  
  // Trường hợp phức tạp hơn
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

  if (/Xem biểu đồ thu chi.*(tháng|gần đây)/i.test(lowerMessage)) {
    return [
      {
        type: 'text',
        text: '📈 Dưới đây là biểu đồ thu chi của bạn:',
        style: 'default',
      },
      {
        type: 'component',
        name: 'MonthlyBarChart',
        layout: 'block',
        props: {
          initialMonths: 3, // hoặc số tháng do người dùng yêu cầu
        }
      }
    ]
  }

  return "🤖 Tôi có thể giúp bạn lập kế hoạch tiết kiệm, phân tích chi tiêu và đưa ra lời khuyên tài chính.\n\nVí dụ:\n• \"Tôi muốn tiết kiệm 50 triệu trong 2 năm\"\n• \"Xem thống kê chi tiêu\"\n• \"Gợi ý đầu tư an toàn\"\n\nBạn muốn bắt đầu với gì?";
  }
