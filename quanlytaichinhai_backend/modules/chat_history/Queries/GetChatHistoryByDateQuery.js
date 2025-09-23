// modules/chat_history/Queries/GetChatHistoryByDateQuery.js
import { DomainException } from "../Entities/ChatMessage.js";

export class GetChatHistoryByDateQuery {
  constructor(userId, date, limit = 50) {
    this.userId = userId;
    this.date = date;
    this.limit = limit;
  }
}

export class GetChatHistoryByDateHandler {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  async handle(query) {
    if (!query.userId || !query.date) {
      throw new DomainException('Thiếu userId hoặc date');
    }
    return await this.#chatRepository.getMessagesByUserIdAndDate(
      query.userId,
      query.date,
      query.limit
    );
  }
}
