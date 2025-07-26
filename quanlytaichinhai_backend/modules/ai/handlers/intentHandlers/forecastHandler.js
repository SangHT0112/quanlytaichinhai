// src/handlers/intentHandlers/forecastHandler.js
import { generateForecastSQLPrompt } from '../../prompts/forecastPrompt.js';
import { fetchWithFailover } from '../../services/geminiService.js';
import { generateExplainPrompt } from '../../prompts/explainPrompt.js';
import db from '../../database/db.js';

export const handleForecast = async ({ user_input, user_id, now }) => {
  const prompt = generateForecastSQLPrompt({ user_input, user_id, now });
  
  const geminiData = await fetchWithFailover({
    contents: [{ parts: [{ text: `${prompt}\nChỉ trả về JSON hợp lệ.` }] }]
  });

  let aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  let structured = {};

  try {
    aiText = aiText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const forecastData = JSON.parse(aiText);

    if (!forecastData?.sql || !forecastData?.goal_amount) {
      structured = { error: "Missing required forecast data" };
    } else {
      const [rows] = await db.query(forecastData.sql);
      
      const explainPrompt = generateExplainPrompt({
        user_input,
        query_result: rows,
        goal_amount: forecastData.goal_amount
      });

      const explainData = await fetchWithFailover({
        contents: [{ parts: [{ text: explainPrompt }] }]
      });

      aiText = explainData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      structured = {
        goal_amount: forecastData.goal_amount,
        sql: forecastData.sql,
        result: rows,
        answer: aiText
      };
    }
  } catch (err) {
    structured = { 
      error: "Forecast processing error", 
      details: err.message 
    };
  }

  return { aiText, structured };
};