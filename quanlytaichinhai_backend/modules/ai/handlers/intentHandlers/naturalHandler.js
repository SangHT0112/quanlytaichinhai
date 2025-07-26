// src/handlers/intentHandlers/naturalHandler.js
import { generateNaturalPrompt } from '../../prompts/naturalPrompt.js';
import { fetchWithFailover } from '../../services/geminiService.js';

export const handleNatural = async ({ user_input, historyText }) => {
  const prompt = generateNaturalPrompt({ user_input, historyText });
  
  const geminiData = await fetchWithFailover({
    contents: [{ parts: [{ text: prompt }] }]
  });

  const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  return {
    aiText,
    structured: null
  };
};