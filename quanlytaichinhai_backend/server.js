import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from "./modules/auth/auth.routes.js"
import overviewRoutes from "./modules/overview/overview.routes.js"
import transactionRoutes from "./modules/transaction/transaction.routes.js"
import statisticalRoutes from "./modules/statistical/statistical.routes.js"
import chatHistoryRoutes from "./modules/chat_history/chat_history.routes.js"
import quickActionsRoutes from "./modules/quickactions/quickactions.routes.js";
import aiRoutes from './modules/ai/ai.routes.js';
import userRoutes from "./modules/users/user.routes.js";
import db from './config/db.js';
dotenv.config();
const app = express();

// CORS
app.use(cors({
    origin: process.env.FRONTEND_API_URL,
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
    res.send('Backend đang hoạt động');
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/transactions", transactionRoutes);
app.use('/api/statistical', statisticalRoutes);
app.use("/api/chat-history", chatHistoryRoutes)
app.use("/api/quickactions", quickActionsRoutes);
app.use("/api/users", userRoutes);
app.use('/api/ai', aiRoutes);
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Khởi tạo HTTP server
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// Khởi tạo Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_API_URL,
        credentials: true
    }
});

// Lưu danh sách user online
const onlineUsers = new Map(); // map socketId => userId
const userSockets = new Map(); // map userId => Set(socketId) để hỗ trợ multi-tab

io.on('connection', (socket) => {
  console.log('Người dùng kết nối (socket):', socket.id);

  // Client gửi user online (gửi khi vừa login/refresh)
  socket.on('user_online', async (userId) => {
    try {
      if (!userId) return;
      // lưu vào map
      onlineUsers.set(socket.id, userId);
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);

      // Cập nhật DB: status = online, last_active_at = NOW()
      try {
        await db.execute(
          "UPDATE users SET status = 'online', last_active_at = NOW() WHERE user_id = ?",
          [userId]
        );
      } catch (dbErr) {
        console.error('DB update error (user_online):', dbErr);
      }

      // Broadcast cho các client khác rằng user này online
      socket.broadcast.emit('user_status', { userId, status: 'online' });
    } catch (err) {
      console.error('user_online handler error:', err);
    }
  });

  // Keep-alive: client định kỳ gửi để cập nhật last_active_at
  // (giúp trường last_active chính xác nếu user vẫn mở tab)
  socket.on('keep_alive', async ({ userId }) => {
    try {
      if (!userId) return;
      // Update last_active_at
      await db.execute("UPDATE users SET last_active_at = NOW() WHERE user_id = ?", [userId]);
    } catch (err) {
      console.error('keep_alive error:', err);
    }
  });

  // Khi disconnect
  socket.on('disconnect', async () => {
    try {
      const userId = onlineUsers.get(socket.id);
      // xóa socket map
      onlineUsers.delete(socket.id);

      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            // Nếu user không còn socket nào => offline thật
            try {
              await db.execute("UPDATE users SET status = 'offline', last_active_at = NOW() WHERE user_id = ?", [userId]);
            } catch (dbErr) {
              console.error('DB update error (disconnect):', dbErr);
            }
            socket.broadcast.emit('user_status', { userId, status: 'offline' });
          } else {
            // user vẫn còn tab khác mở -> vẫn online, không set offline
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
