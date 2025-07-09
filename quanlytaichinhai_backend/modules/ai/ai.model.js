import db from '../../config/db.js';


export const saveFeedback = async ({ user_input, ai_suggested, user_corrected, confirmed }) => {
  const sql = `
    INSERT INTO ai_feedback_logs (user_input, ai_suggested, user_corrected, confirmed)
    VALUES (?, ?, ?, ?)
  `
  const params = [
    user_input,
    JSON.stringify(ai_suggested),
    user_corrected ? JSON.stringify(user_corrected) : null,
    confirmed,
  ]

  await db.execute(sql, params)
}
