import { DomainException } from '../Entities/ChatMessage.js';

export class SaveChatHistoryCommand {
  constructor(userId, messages) {
    this.userId = userId;
    this.messages = messages;
  }
}

export class SaveChatHistoryHandler {
  #chatRepository;

  constructor(chatRepository) {
    this.#chatRepository = chatRepository;
  }

  async handle(command) {
    if (!command.userId || !Array.isArray(command.messages) || command.messages.length === 0) {
      throw new DomainException('Thiếu userId hoặc messages không hợp lệ');
    }

    const domainMessages = command.messages.map(dto => {
      const message = dto.toDomain(command.userId);
      message.validate();
      return message;
    });

    return await this.#chatRepository.saveMessages(domainMessages);
  }
}