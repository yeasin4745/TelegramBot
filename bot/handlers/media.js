const env = require('../../config/env');
const { checkRateLimit } = require('../core');
const storage = require('../../services/storage');

function handlePhoto(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        const rateLimitResult = checkRateLimit(chatId, env.dailyLimit);
        if (!rateLimitResult.allowed) {
            return bot.sendMessage(chatId, rateLimitResult.error);
        }
        await bot.sendChatAction(chatId, 'typing');
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            await bot.sendMessage(chatId, `You sent a photo with caption: ${msg.caption || 'No caption'}`);
            await bot.sendMessage(chatId, "The AI system has not been activated yet.");
        } catch (error) {
            console.error(error);
            await bot.sendMessage(chatId, "Sorry, there was an error processing the image.");
        }
    };
}

function handleVideo(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        const rateLimitResult = checkRateLimit(chatId, env.dailyLimit);
        if (!rateLimitResult.allowed) {
            return bot.sendMessage(chatId, rateLimitResult.error);
        }
        await bot.sendChatAction(chatId, 'typing');
        try {
            await bot.sendMessage(chatId, `You sent a video with caption: ${msg.caption || 'No caption'}`);
            await bot.sendMessage(chatId, "The AI system has not been activated yet.");
        } catch (error) {
            console.error(error);
            await bot.sendMessage(chatId, "Sorry, there was an error processing the video.");
        }
    };
}

function handleDocument(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, `You sent a document: ${msg.document.file_name}`);
        await bot.sendMessage(chatId, "The AI system has not been activated yet.");
    };
}

function handleContact(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, "You sent contact information.");
        await bot.sendMessage(chatId, "The AI system has not been activated yet.");
    };
}

function handleSticker(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, "You sent a sticker.");
        await bot.sendMessage(chatId, "The AI system has not been activated yet.");
    };
}

function handleVoice(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, "You sent a voice message.");
        await bot.sendMessage(chatId, "The AI system has not been activated yet.");
    };
}

function handleAudio(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, "You sent an audio file.");
        await bot.sendMessage(chatId, "The AI system has not been activated yet.");
    };
}

module.exports = {
    handlePhoto,
    handleVideo,
    handleDocument,
    handleContact,
    handleSticker,
    handleVoice,
    handleAudio
};
