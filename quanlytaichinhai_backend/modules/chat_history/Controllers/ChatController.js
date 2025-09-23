import { SaveChatHistoryCommand, SaveChatHistoryHandler } from '../Commands/SaveChatHistoryCommand.js';
import { GetChatHistoryQuery, GetChatHistoryHandler } from '../Queries/GetChatHistoryQuery.js';
import { GetChatHistoryByDateQuery, GetChatHistoryByDateHandler } from '../Queries/GetChatHistoryByDateQuery.js';
import ChatMessageDTO from '../DTOs/ChatMessageDTO.js';

export default class ChatController {
  #saveChatHistoryHandler;
  #getChatHistoryHandler;
  #getChatHistoryByDateHandler;

  constructor(chatRepository) {
    this.#saveChatHistoryHandler = new SaveChatHistoryHandler(chatRepository);
    this.#getChatHistoryHandler = new GetChatHistoryHandler(chatRepository);
    this.#getChatHistoryByDateHandler = new GetChatHistoryByDateHandler(chatRepository);
  }

  async saveHistory(req, res) {
    try {
      const { user_id, messages } = req.body;
      if (!user_id || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Thiếu user_id hoặc messages không hợp lệ' });
      }

      const messageDTOs = messages.map(msg => new ChatMessageDTO(msg));
      const command = new SaveChatHistoryCommand(user_id, messageDTOs);
      const result = await this.#saveChatHistoryHandler.handle(command);

      if (result) {
        return res.json({ success: true });
      }
      return res.status(500).json({ error: 'Lỗi khi lưu lịch sử chat' });
    } catch (error) {
      console.error('Lỗi controller saveHistory:', error);
      return res.status(500).json({ error: error.message || 'Lỗi khi lưu lịch sử chat' });
    }
  }

  async getHistory(req, res) {
    try {
      const { user_id, limit, date } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: 'Thiếu user_id' });
      }

      let history;
      if (date) {
        const query = new GetChatHistoryByDateQuery(user_id, date, parseInt(limit) || 50);
        history = await this.#getChatHistoryByDateHandler.handle(query);
      } else {
        const query = new GetChatHistoryQuery(user_id, parseInt(limit) || 20);
        history = await this.#getChatHistoryHandler.handle(query);
      }

      return res.json(history.map(msg => msg.toJSON()));
    } catch (error) {
      console.error('Lỗi controller getHistory:', error);
      return res.status(500).json({ error: error.message || 'Lỗi khi lấy lịch sử chat' });
    }
  }

  async getRecentHistory(req, res) {
    try {
      const { user_id, limit } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: 'Thiếu user_id' });
      }

      const query = new GetChatHistoryQuery(user_id, parseInt(limit) || 5);
      const history = await this.#getChatHistoryHandler.handle(query);
      return res.json(history.map(msg => msg.toJSON()));
    } catch (error) {
      console.error('Lỗi controller getRecentHistory:', error);
      return res.status(500).json({ error: error.message || 'Lỗi khi lấy lịch sử chat gần nhất' });
    }
  }
}