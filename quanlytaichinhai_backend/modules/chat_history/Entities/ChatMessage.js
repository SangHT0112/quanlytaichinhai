// modules/chat_history/Entities/ChatMessage.js
export class DomainException extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainException';
  }
}

export class ChatMessage {
  #id;
  #content;
  #role;
  #timestamp;
  #userId;
  #structuredData;
  #customContent;
  #imageUrl;
  #intent;
  #userInput;

  constructor({ id, userId, content, role, timestamp, structuredData, customContent, imageUrl, intent, userInput }) {
    if (!id || !userId || !content || !role || !timestamp) {
      throw new DomainException('Thiếu các trường bắt buộc trong ChatMessage');
    }
    if (!['user', 'assistant'].includes(role)) {
      throw new DomainException('Role không hợp lệ, phải là "user" hoặc "assistant"');
    }

    this.#id = id;
    this.#content = content;
    this.#role = role;
    this.#timestamp = new Date(timestamp);
    this.#userId = userId;
    this.#structuredData = structuredData || null;
    this.#customContent = customContent || null;
    this.#imageUrl = imageUrl || null;
    this.#intent = intent || null;
    this.#userInput = userInput || null;
  }

  get id() { return this.#id; }
  get userId() { return this.#userId; }
  get content() { return this.#content; }
  get role() { return this.#role; }
  get timestamp() { return this.#timestamp; }

  validate() {
    if (this.#content.length > 10000) {
      throw new DomainException('Nội dung tin nhắn quá dài');
    }
  }

  toJSON() {
    return {
      id: this.#id,
      userId: this.#userId,
      content: this.#content,
      role: this.#role,
      timestamp: this.#timestamp,
      structuredData: this.#structuredData,
      customContent: this.#customContent,
      imageUrl: this.#imageUrl,
      intent: this.#intent,
      userInput: this.#userInput,
    };
  }
  // static factory: chuyển DB row thành ChatMessage Entity
  static fromDB(row) {
    let structured = null;
    let custom = null;

    try {
      structured = row.structured_data
        ? JSON.parse(row.structured_data)
        : null;
    } catch {
      structured = null;
    }

    try {
      custom = row.custom_content
        ? JSON.parse(row.custom_content)
        : null;
    } catch {
      custom = null;
    }

    return new ChatMessage({
      id: row.message_id || row.id,
      userId: row.user_id || row.userId,
      content: row.content,
      role: row.role,
      timestamp: row.timestamp,
      structuredData: structured,
      customContent: custom,
      imageUrl: row.image_url || row.imageUrl,
      intent: row.intent,
      userInput: row.user_input || row.userInput,
    });
  }
}
