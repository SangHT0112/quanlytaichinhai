// src/handlers/intentClassifier.js
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithFailover } from '../services/geminiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const classifyIntent = async (user_input) => {
  const classifyPromptPath = path.resolve(__dirname, '../../documents/ai_prompt_classify.txt');
  const classifyBasePrompt = await readFile(classifyPromptPath, 'utf-8');
  const classifyPrompt = classifyBasePrompt.replace("${user_input}", user_input);

  const classifyData = await fetchWithFailover({
    contents: [{ parts: [{ text: classifyPrompt }] }]
  });

  const rawIntent = classifyData.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
  const validIntents = ["transaction", "component", "followup", "sql_query", "forecast"];
  
  return validIntents.includes(rawIntent) ? rawIntent : "natural";
};