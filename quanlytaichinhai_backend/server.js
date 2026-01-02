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


// Cache để lưu last_transaction_id (demo 1 user, dùng Map global - production dùng Redis)
const lastTransactionCache = new Map();  // key: user_id, value: last_id (string) từ lần poll trước

// Cache đơn giản: Chỉ lưu last_date (string, ISO format) - key: user_id
const lastDateCache = new Map();  // key: user_id, value: last_transaction_date


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


// ✅ Webhook route cho SePay (sửa để xử lý payload phẳng)
// ✅ Webhook route cho SePay (bỏ verify signature/API key, chỉ xử lý payload)
app.post('/api/sepay/webhook', async (req, res) => {
  try {
    console.log('Webhook received FULL:', JSON.stringify(req.body, null, 2));  // Log đầy đủ payload để debug

    const payload = req.body;
    
    // Fallback cho outgoing/incoming: SePay có thể dùng amount_out/amount_in thay transferAmount
    const amount = payload.transferAmount || 
                   (payload.amount_out ? -parseFloat(payload.amount_out) : 
                   (payload.amount_in ? parseFloat(payload.amount_in) : 0));
    const transferType = payload.transferType || 
                         (payload.amount_out > 0 ? 'out' : 
                         (payload.amount_in > 0 ? 'in' : null));
    
    if (!amount || !transferType || amount === 0) {
      console.log('Skipped invalid payload (no amount/type even with fallback)');
      return res.status(200).json({ received: true });
    }
    console.log('Processed amount/type:', { amount, transferType });  // Log fallback success

    // Map user_id: Thêm retry cho lock timeout
    let demoUserId;
    const effectiveAccount = payload.accountNumber || process.env.DEFAULT_ACCOUNT_NUMBER;
    console.log('🔍 Querying user for account:', effectiveAccount);  // NEW: Log trước query

    try {
      // Retry logic cho lock (max 3 lần)
      let attempts = 0;
      while (attempts < 3) {
        try {
          await db.execute('SET SESSION innodb_lock_wait_timeout = 30');  // Tăng timeout ngắn
          const [rows] = await db.execute(
            'SELECT user_id FROM users WHERE bank_account = ? LIMIT 1',
            [effectiveAccount]
          );
          if (rows.length > 0) {
            demoUserId = rows[0].user_id;
            console.log('✅ Found user_id:', demoUserId);  // NEW: Log success
            break;
          } else {
            console.warn(`⚠️ Không tìm thấy user có bank_account = ${effectiveAccount}`);  // Đã có
            return res.status(404).json({ error: 'User not found for this bank account' });
          }
        } catch (queryErr) {
          attempts++;
          console.error(`Query user attempt ${attempts} failed:`, queryErr.message);
          if (queryErr.code === 'ER_LOCK_WAIT_TIMEOUT' && attempts < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));  // Wait 1s, 2s
          } else {
            throw queryErr;  // Fail sau 3 lần
          }
        }
      }
    } catch (dbErr) {
      console.error('Lỗi khi truy vấn user_id:', dbErr);
      return res.status(500).json({ error: 'Database error when finding user_id' });
    }

    // Parse date (đã OK)
    const { 
      id: transaction_id,
      description,
      rawDate: transactionDate,  // Fallback nếu transactionDate không có
      accumulated,
      content,
      referenceCode,
    } = payload;

    let transaction_date;
    const rawDate = transactionDate || payload.transactionDate;  // Fallback field
    try {
      let parsedDate = new Date(rawDate);
      
      if (isNaN(parsedDate.getTime())) {
        const [datePart, timePart] = rawDate.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        parsedDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      }
      
      const mysqlDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ');
      transaction_date = mysqlDate;
      
      console.log('✅ Parsed MySQL date:', rawDate, '→', transaction_date);
    } catch (dateError) {
      console.error('Date parse error:', dateError.message);
      transaction_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    // Lấy phần cuối sau dấu ";" nếu có
    let effectiveDescription = description || content || 'Giao dịch từ SePay webhook';
    if (effectiveDescription.includes(';')) {
      const parts = effectiveDescription.split(';');
      effectiveDescription = parts[parts.length - 1].trim();
    }

    const status = 'Hoàn tất';
    const transferTypeMapped = transferType.toLowerCase();
    const typeMapped = transferTypeMapped === 'in' ? 'income' : 'expense';

    const autoConfirmedData = {
      response_type: 'transaction',
      transactions: [{
        id: transaction_id || referenceCode || uuidv4(),
        amount: Math.abs(amount),
        type: typeMapped,
        category_id: 9,
        description: effectiveDescription,
        transaction_date,  // String MySQL format
        group_name: 'Giao dịch SePay',
      }],
      total_amount: Math.abs(amount),
      transaction_date,
      user_id: demoUserId,
    };

    // Auto-confirm: Thêm log trước/sau
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    console.log('🔄 Calling auto-confirm with data:', { userId: demoUserId, amount, transaction_date });  // NEW: Log payload
    try {
      const confirmRes = await axios.post(`${backendUrl}/api/ai/confirm`, {
        user_id: demoUserId,
        user_input: 'Giao dịch từ webhook SePay',
        ai_suggested: autoConfirmedData,
        confirmed: true,
      });
      console.log('✅ Auto-confirm success:', confirmRes.status);  // NEW: Log response
    } catch (confirmErr) {
      console.error('❌ Auto-confirm failed:', confirmErr.response?.data || confirmErr.message);  // NEW: Log chi tiết
      // Không return, tiếp tục save message (graceful fail)
    }

    // Tạo & Save message
    const transactionMessage = {
      message_id: uuidv4(),
      content: `🔔 Giao dịch mới: ${transferTypeMapped === 'in' ? 'Nhận' : 'Chuyển'} ${Math.abs(amount).toLocaleString()} VND. Nội dung: ${effectiveDescription}. Trạng thái: ${status}. ${accumulated ? `Số dư: ${Number(accumulated).toLocaleString()} VND.` : ''}`,
      role: 'assistant',
      timestamp: new Date(transaction_date),
      structured: autoConfirmedData,
      intent: 'auto_confirmed_transaction',
      user_input: 'Giao dịch từ webhook',
    };

    // Lưu chat: Thêm try-catch cho save để debug
    try {
      const saved = await saveChatHistory(demoUserId, [transactionMessage]);
      console.log('💾 Chat history saved:', saved);  // NEW: Log save result
      if (!saved) {
        console.error('Failed to save chat history - check model or DB constraints');
      }
    } catch (saveErr) {
      console.error('SaveChatHistory error FULL:', saveErr);  // Log full error để debug
    }

    // Emit socket
    const socketSet = userSockets.get(demoUserId);
    if (socketSet && socketSet.size > 0) {
      socketSet.forEach((socketId) => {
        io.to(socketId).emit('receive_message', {
          id: transactionMessage.message_id,
          content: transactionMessage.content,
          role: transactionMessage.role,
          timestamp: transactionMessage.timestamp.toISOString(),
          structured: transactionMessage.structured,
          intent: transactionMessage.intent,
          user_input: transactionMessage.user_input,
        });
      });
      console.log(`📩 Emitted auto-transaction to user ${demoUserId} (${socketSet.size} sockets)`);
    } else {
      console.log(`💾 User ${demoUserId} offline: Saved to DB only`);
    }

    console.log(`✅ Webhook processed: ${transaction_id || 'unknown'}`);
    res.status(200).json({ received: true, processed: transaction_id || 'unknown' });
  } catch (error) {
    console.error('Webhook error FULL:', error);  // Log full error
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

    // ✅ THÊM: Sau connect, emit event để frontend refetch history (nếu cần)
    socket.on('connect_ack', () => {  // Client emit 'connect_ack' sau connect
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        console.log(`🔄 Trigger refetch history for user ${userId} on reconnect`);
        socket.emit('refetch_history');  // Frontend listen & call fetchHistory
      }
    });
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