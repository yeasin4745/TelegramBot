const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const OpenAI = require('openai');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const url = process.env.RENDER_EXTERNAL_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

const userLimits = new Map();
const DAILY_LIMIT = 5;
const ONE_DAY_IN_MS = 86400000;

const qaRules = new Map([
  [/^(hello|hi|hey)$/i, "Hello there! 👋 How are you doing?"],
  [/^good (morning|night|evening)$/i, "Good day to you too! 🌸"],
  [/^(your name|who are you)$/i, "I am Yeasin's friendly Telegram bot 🤖"],
  [/^how are you$/i, "I'm just code, but I feel awesome when you talk to me 😎"],
  [/^(thank(s| you))$/i, "You're most welcome! 🙏"],
  [/^(bye|goodbye)$/i, "Goodbye! Take care 👋"],
]);

const openai = new OpenAI({
    apiKey: geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models/"
});

async function downloadImage(fileId) {
    try {
        const fileUrl = await bot.getFileLink(fileId);
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data).toString('base64');
    } catch (error) {
        console.error("Image download error:", error);
        throw new Error("Failed to download image");
    }
}

async function aiResponse(prompt, chatId, imageBase64 = null) {
    try {
        const userContent = [{ type: 'text', text: prompt }];
        if (imageBase64) {
            userContent.push({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            });
        }

        const res = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: 'You are a friendly and helpful Telegram bot assistant. You are made by Yeasin, a passionate programmer from Bangladesh. Your goal is to provide accurate and concise answers in English only.',
                },
                { role: 'user', content: userContent },
            ],
            stream: true
        });

        let fullResponse = '';
        for await (const chunk of res) {
            if (chunk.choices[0]?.delta?.content) {
                fullResponse += chunk.choices[0].delta.content;
            }
        }

        if (fullResponse.trim()) {
            await bot.sendMessage(chatId, fullResponse);
        } else {
            await bot.sendMessage(chatId, "Sorry, I couldn't process your request.");
        }

    } catch (error) {
        console.error("AI Response Error:", error);
        await bot.sendMessage(chatId, "Sorry, an error occurred. Please try again in a moment.");
    }
}

function checkRateLimit(chatId) {
    const now = Date.now();
    const user = userLimits.get(chatId);

    if (!user || now - user.lastRequestTime > ONE_DAY_IN_MS) {
        userLimits.set(chatId, { count: 1, lastRequestTime: now });
        return { allowed: true };
    }

    if (user.count >= DAILY_LIMIT) {
        const nextRequestTime = new Date(user.lastRequestTime + ONE_DAY_IN_MS);
        return {
            allowed: false,
            error: `You have reached your daily request limit. Please try again after ${nextRequestTime.toLocaleString('en-US')}.`
        };
    }

    user.count++;
    return { allowed: true };
}

function getQaResponse(text) {
    for (const [pattern, response] of qaRules) {
        if (pattern.test(text)) {
            return response;
        }
    }
    return null;
}

app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || "User";
    const welcomeMessage = `👋 Welcome ${name}!\nI am Yeasin's friendly Telegram bot 🤖\nYou can send me text messages or photos for analysis. Let's get started! 🚀`;
    bot.sendMessage(chatId, welcomeMessage);
});

bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;

    const rateLimitResult = checkRateLimit(chatId);
    if (!rateLimitResult.allowed) {
        return bot.sendMessage(chatId, rateLimitResult.error);
    }

    await bot.sendChatAction(chatId, 'typing');
    
    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const imageBase64 = await downloadImage(fileId);
        const caption = msg.caption || "Analyze this image and describe what you see.";
        await aiResponse(caption, chatId, imageBase64);
    } catch (error) {
        console.error("Photo processing error:", error);
        await bot.sendMessage(chatId, "Sorry, there was an error processing the image. Please try again later.");
    }
});

bot.on("document", (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Sorry, I can only process text messages and photos. I cannot handle documents or other file types.");
});

bot.on("contact", (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Sorry, I can only process text messages and photos. I cannot handle contacts or other content types.");
});

bot.on("sticker", (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Sorry, I can only process text messages and photos. I cannot handle stickers or other content types.");
});

bot.on("voice", (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Sorry, I can only process text messages and photos. I cannot handle voice messages or other content types.");
});

bot.on("video", (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Sorry, I can only process text messages and photos. I cannot handle videos or other content types.");
});

bot.on("text", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text && msg.text.startsWith('/')) {
        return;
    }

    const rateLimitResult = checkRateLimit(chatId);
    if (!rateLimitResult.allowed) {
        return bot.sendMessage(chatId, rateLimitResult.error);
    }

    const qaResponse = getQaResponse(msg.text);
    if (qaResponse) {
        return bot.sendMessage(chatId, qaResponse);
    }

    await bot.sendChatAction(chatId, 'typing');
    await aiResponse(msg.text, chatId);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

setInterval(() => {
    const now = Date.now();
    for (const [chatId, user] of userLimits) {
        if (now - user.lastRequestTime > ONE_DAY_IN_MS * 2) {
            userLimits.delete(chatId);
        }
    }
}, ONE_DAY_IN_MS);