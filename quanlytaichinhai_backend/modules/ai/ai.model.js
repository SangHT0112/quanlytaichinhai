import db from '../../config/db.js';

export const saveFeedback = async ({ user_id, user_input, ai_suggested, user_corrected, confirmed }) => {
  const sql = `
    INSERT INTO ai_feedback_logs (user_id, user_input, ai_suggested, user_corrected, confirmed)
    VALUES (?, ?, ?, ?, ?)
  `;

  const params = [
    user_id,
    user_input,
    JSON.stringify(ai_suggested),
    user_corrected ? JSON.stringify(user_corrected) : null,
    confirmed ?? 0
  ];

  await db.execute(sql, params);
};
