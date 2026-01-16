const TelegramBot = require('node-telegram-bot-api');
const env = require('../config/env');
const commandHandlers = require('./handlers/commands');
const mediaHandlers = require('./handlers/media');
const textHandlers = require('./handlers/text');

const bot = new TelegramBot(env.token, { polling: false });

function initialize() {
    bot.setWebHook(`${env.url}/bot${env.token}`);
    
    bot.onText(/\/start/, commandHandlers.handleStart);
    bot.on('photo', mediaHandlers.handlePhoto(bot));
    bot.on('video', mediaHandlers.handleVideo(bot));
    bot.on('document', mediaHandlers.handleDocument(bot));
    bot.on('contact', mediaHandlers.handleContact(bot));
    bot.on('sticker', mediaHandlers.handleSticker(bot));
    bot.on('voice', mediaHandlers.handleVoice(bot));
    bot.on('audio', mediaHandlers.handleAudio(bot));
    bot.on('text', textHandlers.handleText(bot));
    
    setInterval(() => {
        const now = Date.now();
        const ONE_DAY_IN_MS = 86400000;
        for (const [chatId, user] of userLimits) {
            if (now - user.lastRequestTime > ONE_DAY_IN_MS * 2) {
                userLimits.delete(chatId);
            }
        }
    }, 86400000);
}

const userLimits = new Map();
const ONE_DAY_IN_MS = 86400000;

function checkRateLimit(chatId, dailyLimit) {
    const now = Date.now();
    const user = userLimits.get(chatId);

    if (!user || now - user.lastRequestTime > ONE_DAY_IN_MS) {
        userLimits.set(chatId, { count: 1, lastRequestTime: now });
        return { allowed: true };
    }

    if (user.count >= dailyLimit) {
        const nextRequestTime = new Date(user.lastRequestTime + ONE_DAY_IN_MS);
        return {
            allowed: false,
            error: `You have reached your daily request limit. Please try again after ${nextRequestTime.toLocaleString('en-US')}.`
        };
    }

    user.count++;
    return { allowed: true };
}

module.exports = {
    initialize,
    bot,
    checkRateLimit,
    userLimits
};
