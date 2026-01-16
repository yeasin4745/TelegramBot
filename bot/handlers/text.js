const env = require('../../config/env');
const { checkRateLimit } = require('../core');
const qaRules = require('../../utils/qaRules');

function handleText(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        
        if (msg.text && msg.text.startsWith('/')) {
            return;
        }

        const rateLimitResult = checkRateLimit(chatId, env.dailyLimit);
        if (!rateLimitResult.allowed) {
            return bot.sendMessage(chatId, rateLimitResult.error);
        }

        const qaResponse = getQaResponse(msg.text);
        if (qaResponse) {
            await bot.sendMessage(chatId, qaResponse);
            await bot.sendMessage(chatId, "The AI system has not been activated yet.");
            return;
        }

        await bot.sendChatAction(chatId, 'typing');
        await bot.sendMessage(chatId, `You said: ${msg.text}`);
        await bot.sendMessage(chatId, "The AI system has not been activated yet.");
    };
}

function getQaResponse(text) {
    for (const [pattern, response] of qaRules) {
        if (pattern.test(text)) {
            return response;
        }
    }
    return null;
}

module.exports = {
    handleText
};
