module.exports = {
    token: process.env.TOKEN,
    port: process.env.PORT || 3000,
    url: process.env.RENDER_EXTERNAL_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    dailyLimit: parseInt(process.env.DAILY_LIMIT) || 50
};
