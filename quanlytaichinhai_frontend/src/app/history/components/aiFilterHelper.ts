// aiFilterHelper.ts
export function applyFilterFromAi(
  message: string,
  setFns: {
    setFilterType: (val: string) => void
    setFilterCategory: (val: string) => void
    setFilterMonth: (val: string) => void
    setSearchTerm: (val: string) => void
  },
  categories: string[] = [] // Đổi thành tham số bắt buộc với giá trị mặc định
) {


  const msg = message.toLowerCase();
  console.log('Applying filter for message:', message);

  // Reset tất cả filter trước khi áp dụng mới
  setFns.setFilterType("all");
  setFns.setFilterCategory("all");
  setFns.setFilterMonth("all");
  setFns.setSearchTerm("");

 // Xử lý tìm kiếm riêng biệt - cải tiến regex để bắt chính xác từ khóa
  const searchMatch = msg.match(/(?:tìm kiếm|tìm|search)\s*(?:giao dịch|transaction)?\s*(.+)/i);
  if (searchMatch) {
    const rawKeyword = searchMatch[1].trim();
    
    // Loại bỏ các từ không cần thiết trong từ khóa
    const cleanedKeyword = rawKeyword
      .replace(/giao dịch|transaction/gi, '')
      .trim();
    
    if (cleanedKeyword) {
      setFns.setSearchTerm(cleanedKeyword); // Chỉ lưu từ khóa chính
      setFns.setFilterType("all");
      setFns.setFilterCategory("all");
      setFns.setFilterMonth("all");
      return "search_triggered";
    }
  }

  // Xử lý loại giao dịch
  if (/chi tiêu|tiền ra|thanh toán|mua|chi/.test(msg)) {
    setFns.setFilterType("expense");
  } else if (/thu nhập|tiền vào|lương|thu/.test(msg)) {
    setFns.setFilterType("income");
  }

  // Xử lý category - cải tiến để tìm khớp không hoàn toàn
  const findMatchingCategory = (patterns: RegExp[], keywords: string[]) => {
    // Tìm trong categories trước
    for (const category of categories) {
      const lowerCategory = category.toLowerCase();
      if (patterns.some(p => p.test(lowerCategory)) || 
          keywords.some(k => lowerCategory.includes(k))) {
        return category; // Trả về category gốc (giữ nguyên hoa thường)
      }
    }
    return null;
  };
  
  //Xử lý chi tiêu/thu nhập
  if (/chi tiêu|tiền ra|thanh toán|mua|chi/.test(msg)) {
    setFns.setFilterType("expense");
  }
  // Xử lý category ăn uống
  if (/ăn uống|đồ ăn|nhà hàng|food|restaurant|nước uống|bữa ăn/.test(msg)) {
    const foodCategory = findMatchingCategory(
      [/ăn/, /uống/, /food/, /restaurant/],
      ['ăn', 'uống', 'food']
    ) || "Ăn uống"; // Fallback nếu không tìm thấy
    setFns.setFilterCategory(foodCategory);
  }
  



  // Xử lý tháng
  const monthMatch = msg.match(/tháng (\d{1,2})/);
  if (monthMatch) {
    const month = monthMatch[1].padStart(2, '0'); // Đảm bảo định dạng 2 chữ số
    setFns.setFilterMonth(month);
  }

  console.log("Filter applied:", {
    type: setFns.setFilterType.name,
    category: setFns.setFilterCategory.name,
    month: setFns.setFilterMonth.name
  });

  
}