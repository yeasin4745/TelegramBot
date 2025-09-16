const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const OpenAI = require('openai');
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

async function aiResponse(prompt, id, imageBase64 = null) {
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
                    content: 'You are a friendly and helpful Telegram bot assistant. You are made by Yeasin, a passionate programmer from Bangladesh. Your goal is to provide accurate and concise answers.',
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
            await bot.sendMessage(id, fullResponse);
        } else {
            await bot.sendMessage(id, "Sorry, I couldn't process your request.");
        }

    } catch (error) {
        console.error("AI Response Error:", error);
        await bot.sendMessage(id, "Sorry, an error occurred. Please try again in a moment.");
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
    const welcomeMessage = `👋 Welcome ${name}!\nI am Yeasin's friendly Telegram bot 🤖\nYou can say hello, ask me questions, or just chat casually. Let's get started! 🚀`;
    bot.sendMessage(chatId, welcomeMessage);
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text && msg.text.startsWith('/')) {
        return;
    }

    const rateLimitResult = checkRateLimit(chatId);
    if (!rateLimitResult.allowed) {
        return bot.sendMessage(chatId, rateLimitResult.error);
    }

    if (msg.photo) {
        await bot.sendChatAction(chatId, 'upload_photo');
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileStream = bot.getFileStream(fileId);
            const chunks = [];
            for await (const chunk of fileStream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const imageBase64 = buffer.toString('base64');
            const caption = msg.caption || "Analyze this image and describe it.";
            await aiResponse(caption, chatId, imageBase64);
        } catch (error) {
            console.error("Photo processing error:", error);
            await bot.sendMessage(chatId, "Sorry, there was an error processing the image. Please try again later.");
        }
    } else if (msg.text) {
        const qaResponse = getQaResponse(msg.text);
        if (qaResponse) {
            return bot.sendMessage(chatId, qaResponse);
        }
        await bot.sendChatAction(chatId, 'typing');
        await aiResponse(msg.text, chatId);
    } else {
        return bot.sendMessage(chatId, "Sorry, I can only process text and photos.");
    }
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
