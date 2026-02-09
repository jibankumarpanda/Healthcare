// backend/src/utils/geminiConfig.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with your API key
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY or GOOGLE_API_KEY is missing from environment variables');
} else {
  console.log('✅ Gemini API Key found (ending in ' + apiKey.slice(-4) + ')');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Diagnostic check revealed that 'gemini-1.5-flash' is NOT available 
 * for this API key for 'generateContent'. 
 * 
 * Available stable models found:
 * - 'gemini-2.0-flash-001'
 * - 'gemini-flash-latest'
 * - 'gemini-pro-latest'
 */
const GEMINI_MODEL = "gemini-2.0-flash-001"; 

const model = genAI.getGenerativeModel({ 
  model: GEMINI_MODEL
});

export { model, genAI, GEMINI_MODEL };