import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
// Import routes
import authRoutes from "./modules/auth/auth.routes.js"
import overviewRoutes from "./modules/overview/overview.routes.js"
import transactionRoutes from "./modules/transaction/transaction.routes.js"
import statisticalRoutes from "./modules/statistical/statistical.routes.js"
import chatHistoryRoutes from "./modules/chat_history/chat_history.routes.js"
import aiRoutes from './modules/ai/ai.routes.js';

dotenv.config();
const app = express();


// // Cấu hình Swagger
// const swaggerOptions = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'API Quản lý tài chính',
//       version: '1.0.0',
//     },
//   },
//   apis: ['./modules/**/*.routes.js'], // Đường dẫn đến các file route
// };
// const swaggerSpec = swaggerJsdoc(swaggerOptions);


// CORS configuration
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// Middleware quan trọng
app.use(express.json()); // Thay thế bodyParser.json()
app.use(express.urlencoded({ extended: true })); // Thay thế bodyParser.urlencoded()

// Test route
app.get('/', (req, res) => {
    res.send('Backend đang hoạt động');
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/transactions", transactionRoutes);
app.use('/api/statistical', statisticalRoutes);
app.use("/api/chat-history", chatHistoryRoutes)
//Route Docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/ai', aiRoutes); 
app.use("/public", express.static(path.join(process.cwd(), "public")));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});