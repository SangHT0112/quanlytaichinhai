import axiosInstance from '@/config/axios';
import { ChatMessage, StructuredData, MessageContentPart } from '@/utils/types';
import { MessageRole } from '@/utils/types';

// Kiểu dữ liệu trả về từ server
interface ChatMessageResponse {
  id: number | string;
  role: MessageRole;
  content: string;
  structured?: StructuredData;
  custom_content?: MessageContentPart[];
  imageUrl?: string;
  user_input?: string;
  timestamp: string; // server trả về string
  intent?: string;
}

export const saveChatHistory = async (userId: number, messages: ChatMessage[]): Promise<boolean> => {
  try {
    // console.log('Saving chat history:', { userId, messages }); // Debug
    const response = await axiosInstance.post('/chat-history', {
      user_id: userId,
      messages: messages.map(msg => ({
        message_id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp.toISOString(),
        structured_data: msg.structured,
        custom_content: msg.custom_content,
        image_url: msg.imageUrl,
        intent: msg.intent,
        user_input: msg.user_input,
      })),
    });
    // console.log('Save chat history response:', response.data); // Debug
    return response.data.success;
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử chat:', error);
    return false;
  }
};

export const getChatHistory = async (
  userId: number,
  limit: number = 50,
  date?: string
): Promise<ChatMessage[]> => {
  try {
    // console.log('Fetching chat history:', { userId, limit, date }); // Debug
    const response = await axiosInstance.get<ChatMessageResponse[]>('/chat-history', {
      params: { user_id: userId, limit, date },
    });
    // console.log('Chat history response:', response.data); // Debug

    return response.data.map((msg: ChatMessageResponse): ChatMessage => ({
      ...msg,
      id: msg.id.toString(), // Đảm bảo id là chuỗi
      timestamp: new Date(msg.timestamp),
      structured: msg.structured,
      custom_content: msg.custom_content,
      imageUrl: msg.imageUrl,
      user_input: msg.user_input,
    }));
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat:', error);
    return [];
  }
};

export const clearChatHistory = async (userId: number): Promise<boolean> => {
  try {
    // console.log('Clearing chat history for user:', userId); // Debug
    const response = await axiosInstance.delete('/chat-history', {
      data: { user_id: userId },
    });
    // console.log('Clear chat history response:', response.data); // Debug
    return response.data.success;
  } catch (error) {
    console.error('Lỗi khi xóa lịch sử chat:', error);
    return false;
  }
};
