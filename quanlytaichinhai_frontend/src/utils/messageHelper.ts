import { ChatMessage } from "./types";
// utils/messageHelper.ts
export interface FollowupData {
  question: string;
  suggestedQuery: string;
}

export const extractSqlQueryData = (message: ChatMessage): {
  text: string;
  followup: FollowupData | null;
  hasSqlData: boolean;
} => {
  let text = typeof message.content === 'string' ? message.content : '';
  let followup: FollowupData | null = null;
  let hasSqlData = false;

  // Kiểm tra xem có phải SQL query không
  if (message.intent === 'sql_query' || 
      (message.structured && 'query' in message.structured) ||
      (typeof message.content === 'string' && message.content.includes('```sql'))) {
    hasSqlData = true;
    
    // Ưu tiên base_text từ structured.answer nếu có, fallback content
    let baseText = text;
    if (message.structured) {
      let structuredData = message.structured;
      if (typeof structuredData === 'string') {
        try {
          structuredData = JSON.parse(structuredData);
        } catch {}
      }
      
      if (structuredData && typeof structuredData === 'object') {
        // Nếu có answer trong structured, dùng làm base
        if ('answer' in structuredData && typeof structuredData.answer === 'string') {
          baseText = structuredData.answer;
        }
        
        // Có followup trực tiếp trong structured
        if ('followup' in structuredData && structuredData.followup) {
          followup = {
            question: (structuredData.followup as FollowupData).question || '',
            suggestedQuery: (structuredData.followup as FollowupData).suggestedQuery || ''
          };
        }
      }
    }
    
    // Nếu chưa có followup, thử parse từ baseText
    if (!followup) {
      // Tìm ```json block trước
      let jsonMatch = baseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
      if (!jsonMatch) {
        // Fallback: Match raw JSON object { ... } ở cuối, chứa "followup"
        jsonMatch = /\{[\s\S]*\}/.exec(baseText);
        if (jsonMatch && jsonMatch[0].includes('"followup"')) {
          // Sử dụng match[0] cho toàn bộ JSON
          const jsonStr = jsonMatch[0].trim();
          try {
            const jsonData = JSON.parse(jsonStr);
            if (jsonData.followup && typeof jsonData.followup === 'object') {
              followup = {
                question: jsonData.followup.question || '',
                suggestedQuery: jsonData.followup.suggestedQuery || ''
              };
              // Remove JSON block từ baseText
              baseText = baseText.replace(jsonMatch[0], '').trim();
            }
          } catch (e) {
            console.error('Lỗi parse JSON followup từ baseText:', e);
          }
        }
      } else {
        // Nếu là ```json, parse như cũ
        try {
          const jsonData = JSON.parse(jsonMatch[1].trim());
          if (jsonData.followup && typeof jsonData.followup === 'object') {
            followup = {
              question: jsonData.followup.question || '',
              suggestedQuery: jsonData.followup.suggestedQuery || ''
            };
            // Remove code block
            baseText = baseText.replace(/```json\s*\n[\s\S]*?\n\s*```/, '').trim();
          }
        } catch {}
      }
    }
    
    // Clean thêm: Remove SQL code blocks nếu có
    baseText = baseText.replace(/```sql\s*[\s\S]*?```/g, '').trim();
    
    // Cập nhật text cuối cùng
    text = baseText;
  }

  return { text, followup, hasSqlData };
};