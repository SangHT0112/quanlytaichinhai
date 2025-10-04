// auth.controller.js
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library" // Use import instead of require
import db from "../../config/db.js"
import { findUserByEmail, createUser, findOrCreateGoogleUser } from "./auth.model.js"

export const register = async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) return res.status(400).json({ message: "Thiếu thông tin" })

  try {
    const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [email])
    if (existing.length > 0) 
      return res.status(409).json({ message: "Email đã tồn tại" })

    const hash = await bcrypt.hash(password, 10)
    await db.execute(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hash]
    )

    res.status(201).json({ message: "Đăng ký thành công" })
  } catch (err) {
    console.error("Lỗi đăng ký:", err)
    res.status(500).json({ message: "Lỗi server", error: err.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const displayName = payload['name'];

    const user = await findOrCreateGoogleUser(googleId, email, displayName);
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập bằng Google thành công",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng nhập Google:", err);
    res.status(500).json({ message: "Lỗi đăng nhập Google" });
  }
};