import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { saveChatHistory, getChatHistory } from './modules/chat_history/chat_history.model.js'; // Import hàm từ model
import axios from 'axios'; // Để gọi API AI nếu cần

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import overviewRoutes from './modules/overview/overview.routes.js';
import transactionRoutes from './modules/transaction/transaction.routes.js';
import statisticalRoutes from './modules/statistical/statistical.routes.js';
import chatHistoryRoutes from './modules/chat_history/chat_history.routes.js';
import quickActionsRoutes from './modules/quickactions/quickactions.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import savingsPlansRoutes from './modules/savings_plans/savings_plans.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import userRoutes from './modules/users/user.routes.js';
import db from './config/db.js';

dotenv.config();
const app = express();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_API_URL,
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send('Backend đang hoạt động');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/statistical', statisticalRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/quickactions', quickActionsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/savings-plans', savingsPlansRoutes);
app.use('/api/ai', aiRoutes);
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Khởi tạo HTTP server
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// Khởi tạo Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_API_URL,
    credentials: true,
  },
});

// Lưu danh sách user online
const onlineUsers = new Map(); // map socketId => userId
const userSockets = new Map(); // map userId => Set(socketId)

io.on('connection', (socket) => {
  console.log('Người dùng kết nối (socket):', socket.id);

  // Client gửi user online
  socket.on('user_online', async (userId) => {
    try {
      if (!userId) return;
      onlineUsers.set(socket.id, userId);
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);

      await db.execute(
        'UPDATE users SET status = ?, last_active_at = NOW() WHERE user_id = ?',
        ['online', userId]
      );

      socket.broadcast.emit('user_status', { userId, status: 'online' });
    } catch (err) {
      console.error('user_online handler error:', err);
    }
  });

  // Xử lý tin nhắn mới
  socket.on('send_message', async (data) => {
    let userId; // khai báo ở đây
    try {
     const { userId: uid, message, imageUrl } = data;
     userId = uid;

      // Tạo tin nhắn người dùng
      const userMessage = {
        message_id: uuidv4(),
        content: message || (imageUrl ? 'Đã gửi hình ảnh' : ''),
        role: 'user',
        timestamp: new Date(),
        image_url: imageUrl || null,
        user_input: message,
      };

      // Lưu tin nhắn người dùng vào DB
      const saveResult = await saveChatHistory(userId, [userMessage]);
      if (!saveResult) {
        throw new Error('Lỗi khi lưu tin nhắn người dùng');
      }

      // Gửi tin nhắn người dùng tới tất cả các socket của user
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.forEach((socketId) => {
          io.to(socketId).emit('receive_message', {
            id: userMessage.message_id,
            content: userMessage.content,
            role: userMessage.role,
            timestamp: userMessage.timestamp,
            imageUrl: userMessage.image_url,
            user_input: userMessage.user_input,
          });
        });
      }

      // Gọi API AI để xử lý tin nhắn (nếu không phải hình ảnh)
      let aiMessage = null;
      if (!imageUrl) {
        const conversationHistory = await getChatHistory(userId, 5); // Lấy 5 tin nhắn gần nhất
        const aiResponse = await axios.post(
          `${process.env.BACKEND_URL}/api/ai/chat`,
          {
            message,
            history: conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
              structured: msg.structured ?? null,
            })),
            user_id: userId,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { intent, structured, raw } = aiResponse.data;
        aiMessage = {
          message_id: uuidv4(),
          content: raw || '⚠️ Không nhận được phản hồi từ AI.',
          role: 'assistant',
          timestamp: new Date(),
          structured_data: structured,
          intent,
          user_input: message,
        };

        // Lưu phản hồi AI vào DB
        await saveChatHistory(userId, [aiMessage]);

        // Gửi phản hồi AI tới tất cả các socket của user
        userSocketSet.forEach((socketId) => {
          io.to(socketId).emit('receive_message', {
            id: aiMessage.message_id,
            content: aiMessage.content,
            role: aiMessage.role,
            timestamp: aiMessage.timestamp,
            structured: aiMessage.structured_data,
            intent: aiMessage.intent,
            user_input: aiMessage.user_input,
          });
        });
      }
    } catch (err) {
      console.error('send_message error:', err);
      const errorMessage = {
        message_id: uuidv4(),
        content: '⚠️ Lỗi khi xử lý tin nhắn.',
        role: 'assistant',
        timestamp: new Date(),
      };
      await saveChatHistory(userId, [errorMessage]);
      userSockets.get(userId)?.forEach((socketId) => {
        io.to(socketId).emit('receive_message', errorMessage);
      });
    }
  });

  // Keep-alive
  socket.on('keep_alive', async ({ userId }) => {
    try {
      if (!userId) return;
      await db.execute('UPDATE users SET last_active_at = NOW() WHERE user_id = ?', [userId]);
    } catch (err) {
      console.error('keep_alive error:', err);
    }
  });

  // Khi disconnect
  socket.on('disconnect', async () => {
    try {
      const userId = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);

      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            await db.execute('UPDATE users SET status = ?, last_active_at = NOW() WHERE user_id = ?', ['offline', userId]);
            socket.broadcast.emit('user_status', { userId, status: 'offline' });
          } else {
            userSockets.set(userId, sockets);
          }
        }
      }
      console.log('Socket disconnected:', socket.id);
    } catch (err) {
      console.error('disconnect handler error:', err);
    }
  });
});

// Chạy server
httpServer.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});