import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { saveChatHistory, getChatHistory } from './modules/chat_history/chat_history.model.js';
import axios from 'axios';
import crypto from 'crypto';
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
import sepayRoutes from './modules/sepay/sepay.route.js';  // Giữ import nếu cần, nhưng không dùng nếu webhook inline
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
// Route lấy lịch sử SePay (demo 1 TK, dùng default nếu không truyền param)
app.get('/api/get-sepay', async (req, res) => {
  try {
    const { account_number, date_min, limit = 20 } = req.query;
    
    // Hardcode default TK của bạn nếu không truyền (cập nhật từ response thực tế)
    const effectiveAccount = account_number || process.env.DEFAULT_ACCOUNT_NUMBER || '0915131493';

    const dataSepay = await axios.get('https://my.sepay.vn/userapi/transactions/list', {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SEPAY_TOKEN || ''}`  // Token của bạn
      },
      params: {
        account_number: effectiveAccount,
        transaction_date_min: date_min || undefined,
        limit: parseInt(limit),
      }
    });

    if (dataSepay.status !== 200) {
      throw new Error('Lỗi SePay API: ' + (dataSepay.response?.data?.error || 'Unknown'));
    }

    // Check response format (nếu SePay trả messages.success)
    if (dataSepay.data.messages && !dataSepay.data.messages.success) {
      throw new Error('SePay API error: ' + dataSepay.data.messages.error);
    }

    // Fix: Sử dụng 'transactions' thay vì 'data' dựa trên response thực tế
    const transactions = dataSepay.data.transactions || [];
    res.json(dataSepay.data);
    console.log('SePay data for account', effectiveAccount, ':', transactions.length, 'giao dịch');
  } catch (error) {
    console.error('Error fetching Sepay data:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Sepay data', details: error.message });
  }
});

// Cache để lưu last_transaction_id (demo 1 user, dùng Map global - production dùng Redis)
const lastTransactionCache = new Map();  // key: user_id, value: last_id (string) từ lần poll trước

// Cache đơn giản: Chỉ lưu last_date (string, ISO format) - key: user_id
const lastDateCache = new Map();  // key: user_id, value: last_transaction_date

// ✅ Webhook route cho SePay (thay thế sync thủ công)
app.post('/api/sepay/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', req.body);  // Debug: Log full payload

    // Verify signature nếu có secret
    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers['x-signature'];
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }
      const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
      if (hash !== signature) {
        console.log('Invalid signature:', { received: signature, calculated: hash });  // Debug
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { event, data } = req.body;
    if (!data || event !== 'TRANSACTION_COMPLETED') {  // Chỉ xử lý completed; điều chỉnh event nếu cần
      console.log('Skipped event:', event);  // Debug
      return res.status(200).json({ received: true });  // OK để tránh retry
    }

    const demoUserId = 1;  // Hardcode demo; production: map từ account_number hoặc data
    // ✅ Điều chỉnh fields để match format SePay (tương tự list API: amount_in/out, transaction_date, etc.)
    const { 
      id: transaction_id,  // Hoặc transaction_id
      amount_in = 0, 
      amount_out = 0, 
      transaction_content: description = 'Giao dịch từ SePay webhook',
      transaction_date,  // Hoặc created_at
      accumulated,  // Số dư nếu có
      status 
    } = data;  // Giả sử data là object transaction

    const amount = Number(amount_in || amount_out || 0);
    const transferType = amount_in > 0 ? 'in' : 'out';
    const effectiveDate = transaction_date || new Date().toISOString();  // Fallback nếu thiếu

    const autoConfirmedData = {
      response_type: 'transaction',
      transactions: [{
        id: transaction_id || uuidv4(),  // Fallback ID
        amount: Math.abs(amount),
        type: transferType === 'in' ? 'income' : 'expense',
        category_id: 9,  // Default category
        description,
        transaction_date: effectiveDate,
        group_name: 'Giao dịch SePay',
      }],
      total_amount: Math.abs(amount),
      transaction_date: effectiveDate,
      user_id: demoUserId,
    };

    // Tự động confirm (thêm vào DB qua AI route)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    await axios.post(`${backendUrl}/api/ai/confirm`, {
      user_id: demoUserId,
      user_input: 'Giao dịch từ webhook SePay',
      ai_suggested: autoConfirmedData,
      confirmed: true,  // Không cần form xác nhận
    });

    // Tạo tin nhắn chat
    const transactionMessage = {
      message_id: uuidv4(),
      content: `🔔 Giao dịch mới: ${transferType === 'in' ? 'Nhận' : 'Chuyển'} ${Math.abs(amount).toLocaleString()} VND. Nội dung: ${description}. Trạng thái: ${status || 'Hoàn tất'}. ${accumulated ? `Số dư: ${Number(accumulated).toLocaleString()} VND.` : ''}`,
      role: 'assistant',
      timestamp: new Date(effectiveDate),
      structured: autoConfirmedData,
      intent: 'auto_confirmed_transaction',
    };

    // Lưu chat history
    const saved = await saveChatHistory(demoUserId, [transactionMessage]);
    if (!saved) {
      console.error('Failed to save chat history');
    }

    // Emit socket realtime đến web (nếu user online)
    const socketSet = userSockets.get(demoUserId);
    if (socketSet && socketSet.size > 0) {
      socketSet.forEach((socketId) => io.to(socketId).emit('receive_message', transactionMessage));
      console.log(`📩 Emitted to user ${demoUserId} sockets: ${socketSet.size}`);
    } else {
      console.log(`💾 User ${demoUserId} offline: Saved to DB only`);
    }

    console.log(`✅ Webhook processed: ${transaction_id || 'unknown'} for user ${demoUserId}`);
    res.status(200).json({ received: true, processed: transaction_id || 'unknown' });
  } catch (error) {
    console.error('Webhook error:', error.message || error);
    res.status(500).json({ error: 'Internal error', details: error.message });
  }
});

// Khởi tạo HTTP server (di chuyển Maps trước để an toàn, nhưng JS hoisting OK)
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// Khởi tạo Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_API_URL,
    credentials: true,
  },
});

// Lưu danh sách user online (di chuyển lên trước routes nếu cần, nhưng OK)
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

  // Xử lý tin nhắn mới (FIXED: hỗ trợ clientId, full fields cho error)
  socket.on('send_message', async (data) => {
    let userId;
    try {
      const { userId: uid, message, imageUrl, isSystem, clientId } = data; // FIXED: thêm clientId
      userId = uid;
      if (!userId || (!message && !imageUrl)) {
        throw new Error('Thiếu userId hoặc message/imageUrl');
      }
      const messageId = clientId || uuidv4();
      if (isSystem) {
        // FIXED: Xử lý system/confirm message: role assistant, skip AI, chỉ lưu + emit
        const systemMessage = {
          message_id: messageId,
          content: message,
          role: 'assistant', // FIXED: Role ASSISTANT trực tiếp
          timestamp: new Date(),
          image_url: imageUrl || null,
          user_input: '', // Không có input
          structured_data: null, // Không có structured cho confirm
          intent: 'system_confirm', // Optional: Để frontend biết là confirm
        };

        // Lưu vào DB
        const saveResult = await saveChatHistory(userId, [systemMessage]);
          if (!saveResult) {
            throw new Error('Lỗi khi lưu system message');
          }

        // Emit đến tất cả socket của user với role ASSISTANT
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.forEach((socketId) => {
            io.to(socketId).emit('receive_message', {
              id: systemMessage.message_id,
              content: systemMessage.content,
              role: systemMessage.role,
              timestamp: systemMessage.timestamp,
              imageUrl: systemMessage.image_url,
              user_input: systemMessage.user_input,
              structured: systemMessage.structured_data,
              intent: systemMessage.intent,
            });
          });
        }
        return; // Skip phần còn lại
      }

      // FIXED: dùng clientId nếu có, tránh duplicate ID
      const userMessageId = clientId || uuidv4();
      const userMessage = {
        message_id: userMessageId,
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
            id: userMessage.message_id, // FIXED: dùng userMessageId
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
        const conversationHistory = await getChatHistory(userId, 5);
        const aiResponse = await axios.post(
          `${process.env.BACKEND_URL}/api/ai/chat`, // NOTE: Đảm bảo BACKEND_URL đúng (e.g., http://localhost:4000 nếu self)
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
      if (!userId) {
        console.error('No userId for error handling');
        return; // Skip emit/save nếu không có userId
      }
      const errorId = uuidv4();
      const errorMessage = {
        message_id: errorId,
        content: '⚠️ Lỗi khi xử lý tin nhắn.',
        role: 'assistant',
        timestamp: new Date(),
        user_input: data.message || '',
      };
      await saveChatHistory(userId, [errorMessage]);
      userSockets.get(userId)?.forEach((socketId) => {
        io.to(socketId).emit('receive_message', {
          id: errorMessage.message_id,
          content: errorMessage.content,
          role: errorMessage.role,
          timestamp: errorMessage.timestamp,
          user_input: errorMessage.user_input,
        });
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