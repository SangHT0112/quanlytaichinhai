// src/handlers/intentHandlers/transactionHandler.js
import { generateTransactionPrompt } from '../../prompts/transactionPrompt.js';
import { fetchWithFailover } from '../../services/geminiService.js';
import { parseTransactionResponse } from '../../parsers/transactionParser.js';

export const handleTransaction = async ({ user_input, now, user_id }) => {
  const prompt = await generateTransactionPrompt({ user_input, now, user_id });
  
  const geminiData = await fetchWithFailover({
    contents: [{ parts: [{ text: `${prompt}\nChỉ trả về JSON hợp lệ, không kèm giải thích.` }] }]
  });

  const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  return {
    aiText,
    structured: parseTransactionResponse(aiText, now, user_id)
  };
};