// src/handlers/intentHandlers/componentHandler.js
import { generateComponentPrompt } from '../../prompts/componentPrompt.js';
import { fetchWithFailover } from '../../services/geminiService.js';

export const handleComponent = async ({ user_input }) => {
  const prompt = generateComponentPrompt({ user_input });
  
  const geminiData = await fetchWithFailover({
    contents: [{ parts: [{ text: `${prompt}\nChỉ trả về JSON hợp lệ.` }] }]
  });

  const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  try {
    return {
      aiText,
      structured: JSON.parse(aiText)
    };
  } catch (e) {
    return {
      aiText,
      structured: { error: "Invalid component format" }
    };
  }
};