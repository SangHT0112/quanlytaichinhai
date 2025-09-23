// Sử dụng export default
export default class IChatRepository {
  async saveMessages(messages) {
    throw new Error('Phương thức saveMessages phải được cài đặt');
  }

  async getMessagesByUserId(userId, limit) {
    throw new Error('Phương thức getMessagesByUserId phải được cài đặt');
  }

  async getMessagesByUserIdAndDate(userId, date, limit) {
    throw new Error('Phương thức getMessagesByUserIdAndDate phải được cài đặt');
  }
}