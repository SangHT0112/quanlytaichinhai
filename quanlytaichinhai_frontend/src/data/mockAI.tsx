// services/mockAI.ts
export const MockAI = {
  // Dữ liệu dự đoán chi tiêu (AI Forecast)
  getForecast: (): Promise<{ date: string; amount: number }[]> => {
    return Promise.resolve([
      { date: "2023-10-01", amount: 1500000 },
      { date: "2023-10-02", amount: 1800000 },
      // ...thêm 30 ngày
    ]);
  },

  // Phân loại giao dịch (Auto-Categorization)
  classifyTransaction: (description: string): Promise<{ category: string }> => {
    const categories: Record<string, string> = {
      "starbucks": "food_and_drinks",
      "electricity": "utilities",
      // ...thêm keyword khác
    };
    
    const matchedCategory = Object.keys(categories).find(key => 
      description.toLowerCase().includes(key)
    );
    
    return Promise.resolve({
      category: matchedCategory ? categories[matchedCategory] : "other"
    });
  },

  // Chatbot tư vấn (AI Advisor)
  askAI: (question: string): Promise<{ answer: string }> => {
    const answers: Record<string, string> = {
      "Làm sao để tiết kiệm": "Bạn nên giảm chi tiêu cho ăn uống, hiện chiếm 35% thu nhập.",
      // ...thêm câu hỏi mẫu
    };
    
    return Promise.resolve({
      answer: answers[question] || "Tôi là trợ lý ảo, hiện chưa kết nối AI thật."
    });
  }
};