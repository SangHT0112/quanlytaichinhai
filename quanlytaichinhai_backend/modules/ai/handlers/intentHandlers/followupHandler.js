// src/handlers/intentHandlers/followupHandler.js
import { generateFollowupPrompt } from '../../prompts/followupPrompt.js';
import { fetchWithFailover } from '../../services/geminiService.js';

export const handleFollowup = async ({ user_input, historyText }) => {
  const prompt = generateFollowupPrompt({ user_input, historyText });
  
  const geminiData = await fetchWithFailover({
    contents: [{ parts: [{ text: prompt }] }]
  });

  const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  return {
    aiText,
    structured: null
  };
};