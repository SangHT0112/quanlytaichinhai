import db from "../../config/db.js"

export const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT user_id, username, email, password_hash FROM users WHERE email = ?",
    [email]
  )
  return rows[0]
}

export const createUser = async (username, email, hashedPassword) => {
  const [result] = await db.query(
    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );
  return result.insertId;
}
