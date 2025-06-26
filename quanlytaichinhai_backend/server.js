import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from "./modules/auth/auth.routes.js"
dotenv.config();
const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Backend đang hoạt động');
} )
app.use("/api/auth", authRoutes)


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});