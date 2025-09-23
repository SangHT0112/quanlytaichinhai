import { ChatMessage } from '../Entities/ChatMessage.js';

export default class ChatMessageDTO {
  constructor({ message_id, content, role, timestamp, structured_data, custom_content, image_url, intent, user_input }) {
    this.id = message_id;
    this.content = content;
    this.role = role;
    this.timestamp = timestamp;
    this.structuredData = structured_data;
    this.customContent = custom_content;
    this.imageUrl = image_url;
    this.intent = intent;
    this.userInput = user_input;
  }

  toDomain(userId) {
    return new ChatMessage({
      id: this.id,
      userId,
      content: this.content,
      role: this.role,
      timestamp: this.timestamp,
      structuredData: this.structuredData,
      customContent: this.customContent,
      imageUrl: this.imageUrl,
      intent: this.intent,
      userInput: this.userInput,
    });
  }
}