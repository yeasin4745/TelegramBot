const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const url = process.env.RENDER_EXTERNAL_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function escapeMarkdownV2(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function getGeminiResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    return "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না। 😔";
  }
}

async function sendLongMessage(chatId, text, options) {
  const CHUNK_SIZE = 4096;
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    const chunk = text.substring(i, Math.min(i + CHUNK_SIZE, text.length));
    await bot.sendMessage(chatId, chunk, options);
  }
}

const qaRules = [
  { pattern: /(hello|hi|hey)/i, answer: "Hello there! 👋 How are you doing?" },
  { pattern: /good (morning|night|evening)/i, answer: "Good day to you too! 🌸" },
  { pattern: /(your name|who are you)/i, answer: "I am Yeasin’s friendly Telegram bot 🤖" },
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
I am Yeasin’s friendly Telegram bot 🤖
You can say hello, ask me questions, or just chat casually.
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

  if (msg.text && (msg.text.startsWith('/') || qaRules.some(rule => rule.pattern.test(userMessage)))) {
    return;
  }

  console.log(`No match found. Asking Gemini for: "${userMessage}"`);
  bot.sendChatAction(chatId, 'typing');
  const geminiAnswer = await getGeminiResponse(userMessage);

  const escapedAnswer = escapeMarkdownV2(geminiAnswer);
  
  await sendLongMessage(chatId, escapedAnswer, { parse_mode: "MarkdownV2" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});