const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const url = process.env.RENDER_EXTERNAL_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;
const ownerName = 'Yeasin';
const ownerProfession = 'web developer & problem solver';

// Express app setup
const app = express();
app.use(express.json());

// Telegram bot setup
const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

// Gemini AI setup
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Store for user request limits
const userLimits = {};
const DAILY_LIMIT = 5;
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

function escapeMarkdownV2(text) {
  // Common characters to escape in Markdown V2
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function getGeminiResponse(prompt, userId) {
  try {
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: `Hi.`,
        },
        {
          role: 'model',
          parts: `Hello there! I am a Telegram AI assistant developed by Google. I was built by Yeasin, a professional ${ownerProfession}. How may I help you today?`,
        },
      ],
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    const formattedText = escapeMarkdownV2(responseText);

    await bot.sendMessage(userId, formattedText, { parse_mode: 'MarkdownV2' });

  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    await bot.sendMessage(userId, "Sorry, I am unable to answer right now. 😔 Please try again later.");
  }
}

const qaRules = [
  { pattern: /(hello|hi|hey)/i, answer: "Hello there! 👋 How are you doing?" },
  { pattern: /good (morning|night|evening)/i, answer: "Good day to you too! 🌸" },
  { pattern: /(your name|who are you)/i, answer: `I am ${ownerName}’s friendly Telegram bot 🤖` },
  { pattern: /how are you/i, answer: "I’m just code, but I feel awesome when you talk to me 😎" },
  { pattern: /(thank(s| you))/i, answer: "You’re most welcome! 🙏" },
  { pattern: /(bye|goodbye)/i, answer: "Goodbye! Take care 👋" },
  { pattern: /(study|learning)/i, answer: "Learning is the key to success 📚 Keep going!" },
  { pattern: /(motivate|inspire)/i, answer: "Believe in yourself 🌟 You can achieve anything!" },
];

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "User";
  const welcomeMessage = `👋 Welcome ${name}!
I am a Telegram AI assistant built by Google. My developer is Yeasin, a professional web developer and problem solver.
You can ask me questions or just chat casually.
Let’s get started! 🚀`;
  bot.sendMessage(chatId, welcomeMessage);
});

qaRules.forEach(rule => {
  bot.onText(rule.pattern, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, rule.answer);
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Check for commands or predefined rules
  if (msg.text && (msg.text.startsWith('/') || qaRules.some(rule => rule.pattern.test(userMessage)))) {
    return;
  }

  // Rate Limiting Logic
  const now = Date.now();
  if (!userLimits[chatId]) {
    userLimits[chatId] = {
      count: 0,
      lastRequestTime: now
    };
  }

  const user = userLimits[chatId];
  if (now - user.lastRequestTime > ONE_DAY_IN_MS) {
    user.count = 0;
    user.lastRequestTime = now;
  }
  
  if (user.count >= DAILY_LIMIT) {
    const nextRequestTime = new Date(user.lastRequestTime + ONE_DAY_IN_MS);
    bot.sendMessage(chatId, `Your daily limit has been reached. Please try again after ${nextRequestTime.toLocaleString('bn-BD')}.`);
    return;
  }

  user.count++;
   
  bot.sendChatAction(chatId, 'typing');
  
  getGeminiResponse(userMessage, chatId);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
