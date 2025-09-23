// modules/chat_history/Queries/GetChatHistoryQuery.js
import { DomainException } from "../Entities/ChatMessage.js";

export class GetChatHistoryQuery {
  constructor(userId, limit = 20) {
    this.userId = userId;
    this.limit = limit;
  }
}

export class GetChatHistoryHandler {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  async handle(query) {
    if (!query.userId) {
      throw new DomainException('Thiếu userId');
    }
    return await this.#chatRepository.getMessagesByUserId(query.userId, query.limit);
  }
}
