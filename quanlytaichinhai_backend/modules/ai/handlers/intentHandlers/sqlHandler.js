// src/handlers/intentHandlers/sqlHandler.js
import { generateSQLPrompt } from '../../prompts/sqlPrompt.js';
import { fetchWithFailover } from '../../services/geminiService.js';
import { generateExplainPrompt } from '../../prompts/explainPrompt.js';
import db from '../../database/db.js';

export const handleSQL = async ({ user_input, user_id, historyText }) => {
  const prompt = generateSQLPrompt({ user_id, user_input, historyText });
  
  const geminiData = await fetchWithFailover({
    contents: [{ parts: [{ text: prompt }] }]
  });

  let aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  let structured = {};

  try {
    let sql = aiText.trim().replace(/^```sql\s*/i, "").replace(/```$/i, "").trim();
    
    if (sql === "INVALID_SQL" || !sql.toLowerCase().startsWith("select")) {
      structured = { error: "Invalid SQL query" };
    } else {
      const [rows] = await db.query(sql);
      
      const explainPrompt = generateExplainPrompt({
        user_input,
        query_result: rows
      });

      const explainData = await fetchWithFailover({
        contents: [{ parts: [{ text: explainPrompt }] }]
      });

      aiText = explainData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      structured = {
        query: sql,
        result: rows,
        answer: aiText
      };
    }
  } catch (err) {
    structured = { 
      error: "SQL Execution Error", 
      details: err.message 
    };
  }

  return { aiText, structured };
};