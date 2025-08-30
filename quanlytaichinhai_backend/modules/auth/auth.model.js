import db from "../../config/db.js"

export const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT user_id, username, email, password_hash, role FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
};


export const createUser = async (username, email, hashedPassword) => {
  const [result] = await db.query(
    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );
  return result.insertId;
}

export const findOrCreateGoogleUser = async (googleId, email, displayName) => {
  const [rows] = await db.query(
    "SELECT user_id, username, email, role FROM users WHERE google_id = ? OR email = ?",
    [googleId, email]
  );
  if (rows.length > 0) {
    return rows[0];
  }

  const username = displayName || email.split("@")[0];
  const [result] = await db.query(
    "INSERT INTO users (username, email, google_id, role) VALUES (?, ?, ?, ?)",
    [username, email, googleId, "user"]
  );
  return {
    user_id: result.insertId,
    username,
    email,
    role: "user",
  };
};
