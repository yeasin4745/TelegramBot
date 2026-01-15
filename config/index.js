require('dotenv').config();

module.exports = {
  TOKEN: process.env.TOKEN,
  PORT: process.env.PORT || 3000,
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Rate Limiting
  DAILY_LIMIT: 5,
  ONE_DAY_IN_MS: 86400000,
  
  // AI Configuration
  AI_MODEL: 'gemini-1.5-flash',
  AI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
};