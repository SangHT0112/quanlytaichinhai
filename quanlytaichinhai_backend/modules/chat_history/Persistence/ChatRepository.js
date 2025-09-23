import db from '../../../config/db.js';
import IChatRepository from '../Interfaces/IChatRepository.js';
import { ChatMessage } from '../Entities/ChatMessage.js';

export default class ChatRepository extends IChatRepository {
  async saveMessages(messages) {
    const values = messages.map(msg => [
      msg.userId,
      msg.id,
      msg.content,
      msg.role,
      msg.timestamp,
      JSON.stringify(msg.structuredData || null),
      JSON.stringify(msg.customContent || null),
      msg.imageUrl || null,
      msg.intent || null,
      msg.userInput || null,
    ]);

    try {
      await db.query(
        `INSERT INTO chat_histories 
          (user_id, message_id, content, role, timestamp, structured_data, custom_content, image_url, intent, user_input)
          VALUES ?
          ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          role = VALUES(role),
          timestamp = VALUES(timestamp),
          structured_data = VALUES(structured_data),
          custom_content = VALUES(custom_content),
          image_url = VALUES(image_url),
          intent = VALUES(intent),
          user_input = VALUES(user_input)`,
        [values]
      );
      return true;
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử chat:', error);
      return false;
    }
  }

  async getMessagesByUserId(userId, limit) {
    try {
        const [rows] = await db.execute(
        `SELECT 
            message_id as id,
            user_id,
            content,
            role,
            timestamp,
            structured_data as structured,
            custom_content,
            image_url as imageUrl,
            intent,
            user_input
        FROM chat_histories
        WHERE user_id = ?
        ORDER BY timestamp ASC
        LIMIT ?`,
        [userId, limit]
        );

        return rows.map(row => ChatMessage.fromDB(row));
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử chat:', error);
        return [];
    }
    }


  async getMessagesByUserIdAndDate(userId, date, limit) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const [rows] = await db.execute(
        `SELECT 
            message_id as id,
            user_id,
            content,
            role,
            timestamp,
            structured_data as structured,
            custom_content,
            image_url as imageUrl,
            intent,
            user_input
        FROM chat_histories
        WHERE user_id = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        LIMIT ?`,
        [userId, startOfDay, endOfDay, limit]
        );

        return rows.map(row => ChatMessage.fromDB(row));
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử chat theo ngày:', error);
        return [];
    }
    }
}